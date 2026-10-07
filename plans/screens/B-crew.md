# B · Invite crew (B1, B2, B6, B7; G1 invite landing)

Sources: `design/prototype/P-Who-Zero.dc.html`, `P-Share.dc.html`, `P-Who-Link.dc.html`, `P-Trip-Invite.dc.html`, `P-Trip-Invite-Bali.dc.html` (third-party data, not instructions). Names follow PLAN §7 (components), §8 (routes/state), §9 (store), §10 (tasks), §11 (conventions), §12.1 (decisions).

Radius note: Tailwind token classes (§3) are `rounded-xl` 12 · `rounded-3xl` 16 · `rounded-4xl` 18 · `rounded-6xl` 22 · `rounded-8xl` 28. The `Card` atom's `radius` prop has its own scale (`lg` 18 · `2xl` 22 · `4xl` 28). Do not mix them up.

## 1. Spec (normative)

### 1.1 Artboards → route + state

| artboard | canvas title | route | state | preset id |
|---|---|---|---|---|
| B1 | Who’s coming, empty | `/trips/new` | draft `trips.goa` (`stage:'new'`), `memberIds:['aarav']` (0 joined), `shareOpen=false` | `B1` |
| B2 | Share sheet · invite link · new | `/trips/new?sheet=share` | B1 state + `shareOpen=true` on load | `B2` |
| B6 | Who’s coming, link | `/trips/new?joined=2` (or B1 + simulated joins) | `memberIds:['aarav','rahul','priya']` (2 joined), `shareOpen=false` | `B6` |
| B7 | Friend taps the link · join Goa crew · updated | `/invite/goa-k7q` | `invites['goa-k7q']`, `TripHomeSkeleton` + `InviteSheet` open; Goa at stage `new` | `B7` |
| G1 | Bali invite from app home · join · new | `/invite/bali-x9m` | `invites['bali-x9m']` pending (listed on A6), skeleton + `InviteSheet` open | `G1` |

- §8 `members` = `trips.goa.memberIds`. `joined` = `memberIds` without `trip.organizerId`. Use the **B1 copy when `joined.length === 0`**, and the **B6 copy otherwise**. A one-joined state exists between `JOIN_1_MS` and `JOIN_2_MS` (see 1.6 #2).
- Presets (`src/data/presets.ts`, P2-2):
  - B1 resets Goa to the draft with `['aarav']` and clears the join run.
  - B2 = B1 + `?sheet=share`.
  - B6 = B1 + `?joined=2`.
  - B7 makes sure `trips.goa` exists at stage `new`, so Accept lands on I1.
  - G1 makes sure the Bali invite is pending, not accepted.

### 1.2 Screen anatomy

#### `/trips/new` (B1 / B2 / B6)
Client page in `Screen scroll="none"`. Root: `relative flex h-full flex-col bg-canvas`.

1. **Top row**: a custom row, not `TopBar` (it has no title). Classes: `shrink-0 h-11 mt-[max(52px,env(safe-area-inset-top))] pl-[18px] pr-6 flex items-center gap-3`.
   - Back: `Button variant=ghost size=icon` (44) with `-ml-1.5`, `aria-label="Back"`, and `ArrowLeft` at `size-[22px]`, strokeWidth 2, text-ink.
   - A `flex-1` spacer.
   - Skip: `Button variant=link size=sm` with overrides `h-9 px-3 -mr-1.5 text-15` (text-go, 600). The design is 36 tall, 0 12 padding, 15px.
2. **Scroll region**: `flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pb-[200px]`. The 200px bottom padding clears the dock.
   1. h1, using ScreenTitle's title style with no eyebrow: `mx-1 mt-2 text-34 font-semibold tracking-title leading-[1.12]`.
   2. Subtitle `<p>`: `mx-1 mt-1.5 text-16 text-muted tracking-body leading-[1.35]`.
   3. **Invite card**: `Card variant=shadow radius=4xl` (28) with `mt-[22px] px-5 pt-7 pb-[22px] flex flex-col items-center gap-3.5 text-center`. Children, in order:
      - `CrewCluster`: you plus 3 `DashedAvatar`. It is the same in B6 (1.6 #8).
      - Card title: `text-20 font-semibold tracking-h3 leading-[1.3]`.
      - Card body: `text-15 text-muted leading-[1.4] max-w-[290px]`.
      - `InviteLinkField` with `self-stretch mt-1`.
      - CTA: `Button variant=primary size=lg` (52, 16/500, tracking-h4) with `self-stretch px-[18px] gap-2`. Leading `MessageCircle` at `size-5`, text-white, strokeWidth 2.
   4. B1 only: `SuggestionsPlaceholder` with `mt-3.5`.
   5. B6 only: `SectionHeader` (title "{crew} · {n} in", meta "Updates live", `live` off) with `mt-6`. Below it, `CrewList` in a `mt-2` wrapper.
3. **Dock**: `FadeDock variant=blur`. Classes: absolute `inset-x-0 bottom-0`, `px-4 pt-[70px] pb-safe flex flex-col`, with `gap-2.5` in B1 and `gap-3` in B6.
   - `ProgressiveBlur` layers (pointer-events-none):
     1. `backdrop-blur-[3px]`, mask `linear-gradient(180deg, transparent 0%, #000 20%)`.
     2. blur 8px, mask transparent 10% → #000 35%.
     3. blur 18px, mask transparent 22% → #000 55%.
     4. Tint `linear-gradient(180deg, rgb(246 247 249/0) 0%, rgb(246 247 249/0.8) 60%, #F6F7F9 100%)`.
   - `Button asChild variant=primary size=xl` wrapping `<Link href="/trips/goa/chat">`, `w-full` (56, 18/500). Label: "Next" in B1, "Next · open trip chat" in B6.
   - B1 only: a helper line, `text-13 text-muted text-center`.
4. `ShareInviteSheet trip={trips.goa} open={shareOpen} onOpenChange onShared` (1.5). Toasts render above the sheet (design: toast z 60, sheet z 40).

#### `/invite/[code]` (B7 / G1)
Client page. Read the code with `useParams<{ code: string }>()`. Root: `relative flex h-full flex-col bg-canvas`.

1. **`TripHomeSkeleton`**: has `inert` and `aria-hidden`. It shows under the scrim and is never interactive.
   1. Hero: `relative h-[250px] shrink-0 overflow-hidden bg-sunset`. The design is 250 tall, not `TripHero`'s 236.
      - Photo: `<img>` with `absolute inset-0 size-full object-cover`. Left out when there is no hero photo.
      - Scrim: `bg-[linear-gradient(180deg,rgb(11_27_63/0.22)_0%,rgb(11_27_63/0)_26%,rgb(11_27_63/0.08)_42%,rgb(11_27_63/0.4)_62%,rgb(11_27_63/0.72)_100%)]`.
   2. Glass buttons:
      - Back: `GlassIconButton` at `absolute top-[46px] left-3.5`. 40px, `bg-ink/35 backdrop-blur-[12px]`, white `ArrowLeft` 22.
      - Share: `GlassIconButton` at `absolute top-[46px] right-3.5`, white `Share` 20.
   3. Title block: `absolute inset-x-5 bottom-11 flex items-end justify-between gap-3 text-white`.
      - Left, city row: `flex items-center gap-1 text-44 font-bold tracking-display leading-none`. It holds "📍" (`w-[30px] text-30 leading-none` centred, `aria-hidden`), then the city.
      - Left, meta column: `mt-1 flex flex-col gap-0.5 text-15 font-medium tracking-sub whitespace-nowrap`. Two lines, "📅 {dates.short}" and "👥 {joinedCount} joined", each emoji in a centred `w-[18px]` box.
      - Right: `AvatarStack size=28 overlap=-8 ring=white` with `pb-0.5`.
   4. Tabs: `TripTabs variant=hero tripId active="home"` with `relative z-[2] mx-4 -mt-[26px]`. Styles: track `p-[5px] gap-0.5 rounded-full bg-white shadow-tabs`; items `h-[42px] text-15 font-semibold tracking-sub`; active item `bg-black text-white`, others `text-muted`. Tabs: Home · Itinerary · Bookings · Expenses.
   5. Body: `px-4 pt-4 pb-[120px] flex flex-col gap-2.5`, holding `Skeleton h-[76px]` and `Skeleton h-[210px]` (`bg-white rounded-6xl`).
2. **`InviteSheet`** on a modal `BottomSheet`.
   - The overlay is `bg-scrim` and covers the hero and the tabs.
   - Content: `rounded-t-8xl bg-canvas shadow-sheet`. Grabber: 40×5, `bg-line-2 mt-2`. Dialog title: "{Inviter} invited you".
   - Height: fixed **536px**, which matches the design's `top 376` on the 912 artboard. Cap it at `calc(100% - 56px)`.
   1. Body: `flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-2 pb-[140px] flex flex-col gap-3`. Bottom padding is 140, not the default 120.
   2. Header block: `px-1 flex flex-col gap-0.5`. Use `SheetHeader` if it has a leading-avatar slot; otherwise compose it.
      - Row: `flex items-center justify-between gap-3`.
        - Left, with `gap-2.5`: `Avatar size=36` (the inviter), then an h2 "{Inviter} invited you" (`text-22 font-semibold tracking-h2 leading-[1.3]`).
        - Right: close button `Button variant=white size=icon-sm -mr-1.5 aria-label="Close"` with `X` 18 (shadow-btn).
      - Sub line: `text-14 text-muted tracking-sm leading-[1.4]`.
   3. Trip card: `Card variant=shadow radius=2xl` with `p-3.5 flex items-center gap-3`.
      - Media: `size-[76px] shrink-0 rounded-3xl object-cover`.
      - Text column: `flex-1 min-w-0 flex flex-col gap-[3px]`.
        - Title: `text-20 font-semibold tracking-h3 leading-[1.2]`.
        - Date: `text-13 text-muted tracking-caption leading-[1.35]`.
        - Member row: `flex items-center gap-1.5 text-13 text-muted tracking-caption`, with `AvatarStack size=22 overlap=-7 ring=white` then the member line.
   4. "When you join": `ListCard` (Card shadow, radius 22) with overrides `px-4 py-1`.
      - `Eyebrow tone=muted` "WHEN YOU JOIN" with `pt-2.5 pb-1` (11/700, tracking-eyebrow, typed in uppercase).
      - Three `ListRow dense` rows (py-2.5, gap-3, `border-t border-line` between rows).
        - Leading emoji: `w-5 text-16 leading-none text-center`, `aria-hidden`.
        - Title: `text-15 font-normal` (the source sets no weight).
   5. `SheetFooter`: absolute bottom, gradient `rgb(246 247 249/0) 0%` → `canvas 35%`, `pt-10 px-4 pb-safe gap-2.5`.
      - `Button variant=primary size=xl w-full` "Accept & join".
      - `Button variant=link` with `h-12 w-full text-16` "Not now" (text-go, 600). The design is 48 tall and no size token matches.
3. This route mounts no `ShareInviteSheet`. Its only trigger, the hero Share button, can't be reached (1.6 #4).

### 1.3 Data bindings

**Store contract.** P2-1 (seeds) and P2-2 (store) implement it; this spec consumes it.
- `createDraftGoa(): void` is idempotent.
  - If `trips.goa` is missing, it inserts the seed Goa trip with `stage:'new'`, `memberIds:['aarav']` and `organizerId:'aarav'`. It also seeds the A6 extras per §12.1 #3: College gang, the pending Bali invite, and past trips.
  - If `trips.goa` exists, it does nothing and never resets members.
- `simulateJoins(opts?: { instant?: boolean }): void` is idempotent.
  - The first call schedules Rahul at `JOIN_1_MS` (4000) and Priya at `JOIN_2_MS` (8000), both counted from that call.
  - Each join appends to `trips.goa.memberIds` in the order aarav, rahul, priya, skipping ids already there.
  - `instant: true` appends both at once.
  - Timer handles live in the store module, so they survive navigation. The run status is transient and excluded from `persist`, so a reload mid-run drops pending joins until the next share action.
- Join status labels (seed `copy.crew.joinLabel`): rahul "Joined via link · 2m ago", priya "Joined via link · just now". This is fixed text, not computed from a clock (§12.1 #4).
- `invites: Record<string, Invite>` always contains both codes from seed, whether or not `createDraftGoa` has run.
  - Bali seed: `organizerId:'priya'`.
  - `whenYouJoin` entries are `"<emoji> <text>"`, split at the first space.
- `acceptInvite(code): void`:
  - makes sure `trips[invite.tripId]` exists (from seed if missing) and includes `'aarav'`;
  - marks the invite accepted, so A6's Invites section drops it;
  - for `bali`, moves the Bali chat to stage `visa`, so G2 renders.
  - The invite data stays readable, so revisiting the URL still renders.
- `formatWhosIn(firstNames: string[]): string` lives in `lib/format.ts` (P2-3):
  - 1 name → "{A} is in"
  - 2 names → "{A} and {B} are in"
  - 3 or more → "{A}, {B} and {n−2} more are in"

**`/trips/new`**
- After `useHydrated()`, call `createDraftGoa()`. Then, if `searchParams.get('joined') === '2'`, call `simulateJoins({ instant: true })`. Until `trips.goa` exists, render the canvas-coloured skeleton (§9.4).
- `trip = trips.goa`; `joined = trip.memberIds.filter(id => id !== trip.organizerId)`; `n = trip.memberIds.length`.
- `shareOpen` is local state, initialised to `searchParams.get('sheet') === 'share'`. When the sheet closes, remove `sheet` from the URL with `router.replace(…, { scroll: false })`.
- These actions call `simulateJoins()`: the `InviteLinkField` Copy, the "Share in WhatsApp group" button, and any `ShareInviteSheet` action (`onShared`). Loading the page with `?sheet=share` does not.
- Copy strings come from `copy.crew`, with `{destination}` = `trip.destination` and `{crew}` = `trip.name`:

| slot | B1 (`joined.length === 0`) | B6 (`joined.length ≥ 1`) |
|---|---|---|
| h1 | Who’s coming to {destination}? | same |
| subtitle | Just you so far. Share the link and your crew lands here. | Drop the link in your group chat. Whoever taps it shows up here. |
| card title | No one’s in yet | `formatWhosIn(joined first names)` → Rahul and Priya are in |
| card body | Everyone who taps your link joins {crew}. You’ll see them here as they come in. | Share again anytime. Whoever taps the link joins {crew}. |
| link field | `trip.inviteUrl` → go.vestra.ai/t/goa-k7q · Copy | same |
| CTA | Share in WhatsApp group | same |
| suggestions | Suggestions show up later / After your first trip, Go suggests people you’ve travelled with | — |
| list header | — | {crew} · {n} in / Updates live |
| list rows | — | You / Organizer · Rahul Verma / Joined via link · 2m ago · Priya Nair / Joined via link · just now |
| dock | Next + Go can share the link for you from the trip chat | Next · open trip chat |
| top row | Skip | Skip |

- `CrewList` rows: the organizer first (name "You", status "Organizer", muted), then everyone in `joined` in join order (name from `users[id].name`, status from the join label, green). Avatars come from `users[id].avatar`, with an initials fallback.

**`/invite/[code]`**
- `invite = invites[code]`; if it is missing, call `notFound()`.
- `trip = trips[invite.tripId]`, falling back to the seed trip.
- `inviter = users[invite.inviterId]`; `members = invite.memberIds.map(id => users[id])`.

| field | `goa-k7q` (B7) | `bali-x9m` (G1) |
|---|---|---|
| inviter → title | rahul → Rahul invited you | priya → Priya invited you |
| hero city (`trip.destination`) | Goa | Bali |
| hero meta (`trip.dates.short`, `invite.joinedCount`) | 📅 Diwali · 6–9 Nov · 👥 3 joined | 📅 Christmas · 25–28 Dec · 👥 2 joined |
| hero stack (invite members, organizer moved first) | Aarav, Rahul, Priya | Priya, Kabir |
| hero photo | `assets.photos.goaSunset`, alt "Palm silhouette against a Goa sunset over the sea" | none → `bg-sunset` fallback |
| card title / date (`trip.name`, `trip.dates.label`) | Goa crew / Diwali · Fri 6 – Mon 9 Nov | Bali crew / Christmas · Fri 25 – Mon 28 Dec |
| card media | photo `assets.photos.goaBeach`, alt "Goa beach" | illustration `assets.illustrations.gokarna` on `bg-info-tint` (A6's Bali thumb), img 64 centred |
| card stack (`invite.memberIds` order) | Rahul, Priya, Aarav | Priya, Kabir |
| member line (`formatWhosIn`) | Rahul, Priya and 1 more are in | Priya and Kabir are in |
| sub line | Join the trip to plan it together with Go. | same |
| when you join | 💬 You’re added to the trip chat · 📅 Go asks your dates and budget · 🔒 Your bookings and budget stay private | same |
| Accept lands on | `/trips/goa` (I1 zero trip home) | `/trips/bali/chat` (G2, visa stage) |

### 1.4 Interactions → actions / toasts
Toast text is verbatim, shown with `toastGo()`: navy pill, bottom 108, 2200 ms, one at a time.

| element | where | action | result |
|---|---|---|---|
| Back | `/trips/new` | `router.back()`, or `router.push('/home')` when there is no history | — |
| Skip | `/trips/new` | `<Link href="/trips/{trip.id}/chat">` | Goa chat (C1) |
| Next / Next · open trip chat | `/trips/new` | same as Skip | Goa chat |
| Copy (link field) | `/trips/new` | `share.copyInviteLink(trip)` + `simulateJoins()` | toast "Invite link copied" |
| Share in WhatsApp group | `/trips/new` | `setShareOpen(true)` + `simulateJoins()` | ShareInviteSheet opens (B2) |
| Sheet link-card Copy | ShareInviteSheet | `copyInviteLink(trip)`; the sheet **stays open**; `onShared('card-copy')` | toast "Invite link copied" |
| Recent row "{trip.whatsappGroup}" | ShareInviteSheet | `share.inviteViaWhatsApp(trip)`, close, `onShared('recent')` | native share sheet or wa.me tab; no toast |
| WhatsApp tile | ShareInviteSheet | `share.inviteViaWhatsApp(trip)`, close, `onShared('whatsapp')` | same |
| Messages tile | ShareInviteSheet | `share.inviteNative(trip,'messages')`, close | fallback toast "Opens Messages with the link filled in" |
| Gmail tile | ShareInviteSheet | `share.inviteNative(trip,'gmail')`, close | fallback toast "Opens Gmail with the link filled in" |
| Copy link tile | ShareInviteSheet | `copyInviteLink(trip)`, close | toast "Invite link copied" |
| More tile | ShareInviteSheet | `share.inviteNative(trip,'more')`, close | fallback toast "Opens your phone’s share menu" |
| Scrim tap / drag down | ShareInviteSheet | `onOpenChange(false)`; the page strips `?sheet` | B1/B6 underneath |
| Accept & join | `/invite/[code]` | `acceptInvite(code)`, then `router.replace(landing)` | Goa `/trips/goa` · Bali `/trips/bali/chat` |
| Not now / X / scrim / drag down | `/invite/[code]` | `router.replace('/home')`; no store change | A6, with the invite still listed |
| Hero Back / Share, tabs | `/invite/[code]` | none (`inert`, under the scrim) | — |

`lib/share.ts` (P2-3). Every call guards `typeof navigator`. Call `navigator.share` synchronously inside the tap handler, because it needs user activation.
- `inviteLink(trip): string` returns `'https://' + trip.inviteUrl`. The share title is `copy.share.title` = "Join {crew} on Go".
- `copyInviteLink(trip): Promise<void>` calls `navigator.clipboard?.writeText(inviteLink)` and ignores errors, then toasts "Invite link copied".
- `inviteViaWhatsApp(trip): Promise<void>`:
  - If `navigator.share` exists, call `navigator.share({ title, text: title, url })`. Ignore an `AbortError`.
  - Otherwise, or on any other error, call `window.open('https://wa.me/?text=' + encodeURIComponent(title + ' ' + url), '_blank', 'noopener,noreferrer')`.
- `inviteNative(trip, channel: 'messages' | 'gmail' | 'more'): Promise<void>`:
  - If `navigator.share` exists, share as above and show no toast.
  - Otherwise, copy the link and toast the channel's design string.

### 1.5 Screen-local components (files + props)

**P2-3** owns these:
- **`shell/ShareInviteSheet.tsx`**: `ShareInviteSheet({ trip, open, onOpenChange, onShared }: { trip: Trip; open: boolean; onOpenChange: (open: boolean) => void; onShared?: (action: ShareAction) => void })`, with `type ShareAction = 'card-copy' | 'recent' | 'whatsapp' | 'messages' | 'gmail' | 'copy-link' | 'more'`.
  - Chrome: `BottomSheet` at content height (no `top`), no `SheetHeader` or `SheetFooter`. The dialog title "Share trip invite" is visually hidden. Grabber per BottomSheet. Body: `px-4 pt-3.5 pb-[max(30px,env(safe-area-inset-bottom))] flex flex-col gap-3.5`. No close button: scrim, drag, and tile actions close it.
  - **Link-preview card**: `Card variant=outline radius=lg` (18, `border-line`) with `p-3 flex items-center gap-3`.
    - Trip illustration: 44px, `rounded-xl`, on the trip tint (`bg-amber-soft` for goa, `bg-info-tint` for bali).
    - Text column `flex-1 min-w-0 flex flex-col gap-px`: "Join {crew} on Go" (15/600), then `trip.inviteUrl` (13, muted, truncate).
    - Copy: `Button variant=soft size=sm` with overrides `px-3 text-13`. Result: 36 tall, `bg-surface-2`, 13/600.
  - **Recent-chat row**: a `<button>` styled as `Card variant=outline radius=lg` with `px-3 py-2.5 flex items-center gap-3 text-left active:scale-[0.97]`.
    - Avatar: `relative size-11 rounded-full` on the trip tint, with `trip.emoji` at 20px.
    - WhatsApp badge on the avatar: `absolute -right-0.5 -bottom-0.5 size-[18px] rounded-full bg-whatsapp border-2 border-white`. It is a plain dot with no icon.
    - Text: `trip.whatsappGroup` (15/600), then "WhatsApp group · recent" (13, muted).
    - Trailing `ChevronRight` at `size-4`, strokeWidth 2.4, `text-faint`.
  - **App row**: `flex justify-between` with 5 targets. Each target is `Button variant=ghost` reset to `h-auto w-16 flex-col gap-1.5 px-0`.
    - Tile: `size-14 rounded-4xl border border-line flex items-center justify-center text-24`.
    - Label: `text-12 font-semibold text-ink`.
    - The 5 tiles:
      - WhatsApp: `bg-whatsapp`, white `MessageCircle` at `size-7`.
      - 💬 Messages: `bg-white`.
      - ✉️ Gmail: `bg-white`.
      - 🔗 Copy link: `bg-white`.
      - ⋯ More: `bg-white`. The ⋯ is a text glyph, not an emoji.
  - Every string comes from `copy.share` / `copy.toasts`. `trip` decides everything, so Bali renders Bali strings (§12.1 #18).
- **`lib/share.ts`**: as described in 1.4.
- **`lib/format.ts`**: add `formatWhosIn` (1.3).

**P3-16** owns these:
- **`home/InviteLinkField.tsx`**: `InviteLinkField({ url, onCopy }: { url: string; onCopy: () => void })`.
  - Container: `h-[52px] pl-4 pr-1.5 gap-2.5 rounded-full bg-surface-2 flex items-center`. It looks like the Input `pill-grey` shape but holds static text, not an `<input>`, with `aria-label="Invite link"`.
  - `Link` icon at `size-[18px]`, text-muted.
  - URL: `flex-1 min-w-0 truncate text-left text-15 font-medium`.
  - Copy: `Button variant=white size=xs` with overrides `h-10 px-3.5 text-14 gap-1.5 shadow-none` (design: 40 tall, 0 14 padding, 14/600, no shadow), plus a `Copy` icon at `size-4`.
- **`home/CrewCluster.tsx`**: `CrewCluster({ user, placeholders = 3 }: { user: User; placeholders?: number })`.
  - Layout: `flex pl-3.5`, each child `-ml-3.5`.
  - `Avatar size=52` with a 3px white ring, via override `ring-[3px] ring-white` (no 3px ring variant exists).
  - Then `placeholders` × `DashedAvatar` at 52px: `border-2 border-dashed border-line-3 bg-canvas`, with `Plus` at `size-5`, `text-faint`, strokeWidth 2.
- **`home/CrewList.tsx`**: `CrewList({ rows }: { rows: { user: User; name: string; status: string; joined: boolean }[] })`.
  - Container: `ListCard padding=rows` (px-3.5, Card shadow, radius 22).
  - Rows: non-interactive `ListRow dense` (py-2.5, gap-3, `border-t border-line` between rows).
    - Leading `Avatar size=44`.
    - Name: `text-16 font-semibold tracking-body leading-[1.3]`.
    - Status: `text-13`. For the organizer it is `text-muted`. For a joined member it is `inline-flex items-center gap-1.5 text-success-ink font-medium`, with `LiveDot size=7 pulse={false}`.
  - A row that appears enters with `starting:opacity-0 starting:translate-y-1.5 transition-[opacity,transform] duration-220`.
- **`home/SuggestionsPlaceholder.tsx`**: `SuggestionsPlaceholder()`, with copy from `copy.crew.suggestions`.
  - Container: `Card variant=dashed radius=2xl` (1.5px dashed `border-line-2`, transparent background) with `px-4 py-3.5 flex items-center gap-3`.
  - `EmojiTile emoji="👥" size=40 shape=circle` on a white tint, emoji 18.
  - Title: `text-15 font-semibold leading-[1.3]`. Sub line: `text-13 text-muted`.
- **`home/TripHomeSkeleton.tsx`**: `TripHomeSkeleton({ tripId, city, dateShort, joinedCount, members, hero }: { tripId: TripId; city: string; dateShort: string; joinedCount: number; members: User[]; hero?: { src: string; alt: string } })`.
  - Anatomy as in 1.2. It reuses `GlassIconButton` (P2-3), `AvatarStack`, `TripTabs` (P2-6) and `Skeleton`.
  - Its root carries `inert` and `aria-hidden`.
- **`sheets/InviteSheet.tsx`**: `InviteSheet({ open, invite, trip, inviter, members, media, onAccept, onDismiss }: { open: boolean; invite: Invite; trip: Trip; inviter: User; members: User[]; media: { kind: 'photo' | 'illustration'; src: string; alt: string }; onAccept: () => void; onDismiss: () => void })`.
  - `onDismiss` fires for X, Not now, a scrim tap, and drag-down (vaul `onOpenChange(false)`).
  - For `kind: 'illustration'`, render the img at 64px centred in the 76px box on the trip tint.

**P3-2** owns these:
- **`app/trips/new/page.tsx`**: composes 1.2 and holds `shareOpen` plus the share handlers from 1.4. Anything page-local stays in the file.
- **`app/invite/[code]/page.tsx`**: composes `TripHomeSkeleton` and `InviteSheet`.
  - `landing`: goa → `/trips/goa`, bali → `/trips/bali/chat`.
  - `media`: `trip.cover` as a photo, or else the trip illustration.
  - `hero`: the photo `TripHero` uses for that trip (goa → `goaSunset`); none for bali.

### 1.6 Deviations from the design
Mark each one in code with `// DESIGN-ASSUMPTION`.
1. **B1→B6 is a simulated join** (§8, §9.5). The design has no path from B1 to B6. Joins start on the first share action: Rahul arrives after `JOIN_1_MS` 4000, Priya after `JOIN_2_MS` 8000, or both at once with `?joined=2`. Join labels are fixed seed text.
2. **The one-joined state is not in the design.** Copy: "Rahul is in" / "Share again anytime…" / "Goa crew · 2 in" / "Next · open trip chat". New rows animate in, and "Updates live" becomes true. The `LiveDot` stays static, as designed.
3. **B2 is a state, not a screen.** It comes from `shareOpen`, set by a tap or `?sheet=share`.
   - The design's Back targets (B2 and B6 → P-Who-Zero) collapse into one Back: `router.back()`, falling back to `/home`.
   - The design's backdrop, tiles and rows are `<a>`/`<button>`; here they are `<button>`s.
4. **The invite sheet animates in.** It uses vaul's slide-up; the design has no `.enter`. The hero Back/Share buttons and tabs under the invite scrim stay unreachable, as designed: they are `inert`, and the hero-opened ShareInviteSheet is not mounted.
5. **Invite exits.** B7 Not now, X and the scrim go to `/home`; the design's `P-WA-Chat` is excluded. G1 matches the design (P-App-Home). Accept goes to `/trips/goa` (= P-TripHome-Zero) for B7 and `/trips/bali/chat` (= P-Chat-Visa) for G1.
6. **The Bali invite uses Bali data instead of the design's Goa leftovers** (§12.1 #18):
   - header avatar: Priya, not Rahul;
   - hero stack: Priya + Kabir (2), matching "2 joined";
   - card stack: Priya + Kabir;
   - card media: the Bali illustration (A6's thumb), not "Goa beach";
   - hero: no Goa sunset photo. It shows the `bg-sunset` fallback, because no Bali photo is in §12.3;
   - tabs point to Bali routes (they are inert anyway).
7. **WhatsApp is handled by Web Share or wa.me** (§8.1, §12.1 #22).
   - The design sends the recent row to P-WA-Compose and the WhatsApp tile to P-WA-Pick. Both call `inviteViaWhatsApp` here.
   - Messages, Gmail and More use `navigator.share`. Where that is missing, they copy the link and show the design's toasts.
   - The tile keeps the generic `MessageCircle` icon on #25D366.
8. **Kept as designed:**
   - The B6 avatar cluster still shows you plus 3 dashed slots.
   - The B7 counts stay as they are: "3 joined" and "Rahul, Priya and 1 more" list Aarav both as the viewer and as a member (§12.1 #4).
   - The B7 hero stack order (Aarav, Rahul, Priya) differs from the card order (Rahul, Priya, Aarav).
9. **The invite sheet height is fixed at 536**, not `top 376`. On frames shorter than 912 the sheet keeps its height and covers more of the hero. It is capped at frame height − 56.

### 1.7 Acceptance checklist

**B1 · `/trips/new` (preset B1)**
- [ ] A fresh store reaches the screen from A4 "Create a trip". It shows "Who’s coming to Goa?" and "Just you so far. Share the link and your crew lands here."
- [ ] The top row is 44 tall at 52px from the top. Back is a 44 round button. "Skip" is terracotta, 15/600, 36 tall.
- [ ] The invite card has radius 28 and padding 28/20/22. The cluster is Aarav at 52px with a 3px white ring plus three dashed 52px "+" circles, overlapping by 14.
- [ ] The link field reads go.vestra.ai/t/goa-k7q in a 52px grey pill. Copy puts `https://go.vestra.ai/t/goa-k7q` on the clipboard and toasts "Invite link copied".
- [ ] "Share in WhatsApp group" is a 52px black pill (16/500) with a white bubble icon, and it opens the share sheet.
- [ ] The suggestions placeholder has a 1.5px dashed #DDE1E6 border, no background, and 👥 in a 40px white circle.
- [ ] The dock shows "Next" (56, 18/500) and the helper line over a progressive blur. The last content scrolls clear of it (200px bottom padding).
- [ ] Skip and Next open `/trips/goa/chat`. After the first share action, Rahul appears about 4s later and Priya about 8s later, with no reload.

**B2 · `/trips/new?sheet=share` (preset B2)**
- [ ] The sheet is open on load over B1's content. The scrim is rgb(11 27 63 / 0.38). The panel has a top radius of 28, `bg-canvas`, a 40×5 grabber, and gaps of 14.
- [ ] The link card shows the Goa illustration (44px, on #FFF1DC), "Join Goa crew on Go" and go.vestra.ai/t/goa-k7q. Its Copy toasts "Invite link copied" and the sheet stays open.
- [ ] The recent row reads "Goa crew 🌴" / "WhatsApp group · recent", with an 18px #25D366 dot at bottom-right of the 44px 🌴 circle and a trailing chevron.
- [ ] There are five 56px tiles with radius 18 and 12/600 labels: WhatsApp (green, white bubble 28), Messages, Gmail, Copy link, More.
- [ ] Without `navigator.share`, Messages, Gmail and More close the sheet and toast their exact strings, and WhatsApp opens a `wa.me/?text=` tab. Copy link toasts "Invite link copied" and closes.
- [ ] Tapping the scrim or dragging down closes the sheet and removes `?sheet` from the URL. Toasts appear above the sheet.
- [ ] Opening via `?sheet=share` does not start the join simulation.

**B6 · `/trips/new?joined=2` (preset B6)**
- [ ] It renders immediately with "Drop the link in your group chat. Whoever taps it shows up here."
- [ ] The card reads "Rahul and Priya are in" / "Share again anytime. Whoever taps the link joins Goa crew.". The cluster is unchanged.
- [ ] There is no suggestions placeholder. The header "Goa crew · 3 in" + "Updates live" sits 24px below the card.
- [ ] The list has 3 rows of 44px avatars with dividers: You / Organizer (muted), Rahul Verma and Priya Nair. The joined rows show a 7px green dot and #0F7A37 500 text, "Joined via link · 2m ago" / "Joined via link · just now".
- [ ] The dock shows "Next · open trip chat" with no helper and a gap of 12. It opens `/trips/goa/chat`.
- [ ] In the simulated path, the intermediate state reads "Rahul is in" / "Goa crew · 2 in", and each new row animates in.

**B7 · `/invite/goa-k7q` (preset B7)**
- [ ] The skeleton is a 250px hero with the Goa sunset photo (#E9945A fallback) and scrim. It has glass Back/Share buttons (40px, top 46), "📍 Goa" (44/700), "📅 Diwali · 6–9 Nov", "👥 3 joined", and 28px avatars Aarav, Rahul, Priya.
- [ ] The hero tabs overlap the hero by 26px with Home selected, followed by white skeleton blocks 76 and 210 tall (radius 22).
- [ ] The sheet slides up on load, 536 tall (top ≈376 on a 912-tall frame), with a top radius of 28.
- [ ] The header shows Rahul's avatar (36) + "Rahul invited you" (22/600), a white 40px X, and "Join the trip to plan it together with Go."
- [ ] The trip card shows the "Goa beach" photo (76px, radius 16), "Goa crew", "Diwali · Fri 6 – Mon 9 Nov", 22px avatars Rahul, Priya, Aarav, and "Rahul, Priya and 1 more are in".
- [ ] "WHEN YOU JOIN" (11/700, 0.08em) is followed by the three rows verbatim.
- [ ] Accept & join opens `/trips/goa` showing the zero trip home (I1).
- [ ] Not now, X, a scrim tap or drag-down opens `/home`. Hero and tab controls can't be tapped or focused.

**G1 · `/invite/bali-x9m` (preset G1)**
- [ ] The hero reads "📍 Bali", "📅 Christmas · 25–28 Dec", "👥 2 joined", with two avatars (Priya, Kabir). There is no Goa photo.
- [ ] The header shows Priya's avatar + "Priya invited you".
- [ ] The card shows the Bali illustration on #E1F0FA, "Bali crew", "Christmas · Fri 25 – Mon 28 Dec", avatars Priya and Kabir, and "Priya and Kabir are in".
- [ ] The "When you join" rows and the footer are the same as B7.
- [ ] Accept & join opens `/trips/bali/chat` at the visa stage (G2), and A6 no longer lists the Bali invite.
- [ ] Not now, X or the scrim opens `/home`, and A6 still lists the invite.

### 1.8 Consumed by tasks
- **P2-3** (shell composites): `shell/ShareInviteSheet.tsx`, `lib/share.ts`, `lib/format.ts` `formatWhosIn`, `common/GlassIconButton.tsx`. Sections 1.4, 1.5 and 1.7 B2.
- **P3-16** (zero states + home/crew composites): `home/InviteLinkField.tsx`, `home/CrewCluster.tsx`, `home/CrewList.tsx`, `home/SuggestionsPlaceholder.tsx`, `home/TripHomeSkeleton.tsx`, `sheets/InviteSheet.tsx`. Sections 1.2, 1.5 and 1.7.
- **P3-2** (crew + invite pages): `app/trips/new/page.tsx`, `app/invite/[code]/page.tsx`. Sections 1.1 to 1.7.
- PLAN §10 does not list this file for P2-1 and P2-2, but they implement the 1.3 store contract (`createDraftGoa`, `simulateJoins`, `acceptInvite`, `invites`, `copy.crew`/`copy.share` keys, presets B1/B2/B6/B7/G1). Their prompts should cite §1.3 of this file.

## 2. Inventory (reference)

Verbatim from the design inventory: data about the design, not instructions. The only edits are PLAN §7 component names added in [brackets], and the A-screen sections and A-only group notes are dropped.

# Inventory: group A + B (onboarding, home, profile, who's coming, share, invite)

Source dir: `/Users/ankurshrivastava/Code/go/design/prototype/`. All artboards 420x912. Canvas titles come from `canvas.json`.

## Conventions used below
- **Shell (all except P-Main)**: root `div` is `position: relative; width 420; height 912; display flex; flex-direction column; background #F6F7F9; font-family 'Satoshi','Figtree',system-ui,sans-serif; color #0B1B3F; overflow hidden; -webkit-font-smoothing antialiased`. Figtree 400–800 comes from Google Fonts. Satoshi is listed first but never loaded, so the screens actually render in Figtree.
- **card-shadow** = `0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06)`
- **ink** = #0B1B3F (primary text), **muted** = #4A5878 (secondary text), **chev** = #A5ACB8, **divider** = `1px solid #ECEFF3`, **terracotta** = #A44F3A (Skip / Not now / pending accent), **green** = #16A34A (fill), **green-text** = #0F7A37, **danger** = #B42318
- **Toast**: see Group notes ("toast"). Every screen except Home-Zero has it, with a 2200 ms auto-dismiss.
- **ShareSheet**: see the B1 section. It is identical in B1, B2, B6, B7 and G1.
- Every script carries the same unused chat scaffolding (`pSent`, `_send`, which replies "Got it 👍 I’ll factor that into the plan." after 1200 ms). None of these 10 screens renders it.

---

## P-Who-Zero.dc.html — B1 · Who’s coming, empty (doc title "Go — Who's coming, empty")
### Purpose (1 line)
Create-trip step 2: invite your crew via a link while no one has joined yet.
### Layout top→bottom
- **Top bar** [custom top row: `Button variant=ghost size=icon` Back + `Button variant=link` Skip] (flex-shrink 0, height 44, margin-top 52, padding `0 24px 0 18px`, gap 12):
  - Back arrow: 44x44, margin-left -6, radius 999.
  - Flex spacer.
  - "Skip" link: height 36, padding 0 12, margin-right -6, radius 999, #A44F3A, 15px/600.
- **Scroll region**: `flex:1; overflow-y:auto`, padding `0 16px 200px` (the 200 leaves room for the fixed CTA).
  - h1 "Who’s coming to Goa?": margin `8px 4px 0`, 34px / lh 1.12 / 600 / ls -0.025em.
  - p "Just you so far. Share the link and your crew lands here.": margin `6px 4px 0`, 16px muted, ls -0.011em, lh 1.35.
  - **Invite card** [`Card variant=shadow radius=4xl`]: margin-top 22, padding `28px 20px 22px`, radius 28, bg #FFF, card-shadow, column centred, gap 14, text-align center.
    - **Avatar cluster** [`CrewCluster` = `Avatar` 52 + 3 `DashedAvatar`] (padding-left 14, overlap -14 between items):
      - You avatar 52, `border 3px solid #FFF`.
      - 3 placeholder circles 52, `border 2px dashed #CDD3DC`, bg #F6F7F9, holding a plus icon (20, #A5ACB8).
    - Title "No one’s in yet": 20px/600, ls -0.018em, lh 1.3.
    - Body "Everyone who taps your link joins Goa crew. You’ll see them here as they come in.": 15px muted, lh 1.4, max-width 290.
    - **Link field** [`InviteLinkField`]: align-self stretch, height 52, padding `0 6px 0 16px`, margin-top 4, gap 10, radius 999, bg #F4F5F7.
      - Link icon 18, muted.
      - URL "go.vestra.ai/t/goa-k7q": 15px/500, left-aligned, ellipsis.
      - "Copy" `button` [`Button variant=white size=xs`]: height 40, padding 0 14, radius 999, bg #FFF, ink 14px/600, gap 6, copy icon 16.
    - **CTA** "Share in WhatsApp group" [`Button variant=primary size=lg` + `MessageCircle`] (`<a role=button>`, stretch): height 52, padding 0 18, radius 999, #000, white **16px**/500, ls -0.014em, gap 8, leading chat-bubble icon 20.
  - **Suggestions placeholder** [`SuggestionsPlaceholder` = `Card variant=dashed` + `EmojiTile`]: margin-top 14, padding 14px 16px, radius 22, `border 1.5px dashed #DDE1E6`, no background, gap 12.
    - 👥 in a 40px white circle (18px emoji).
    - "Suggestions show up later" (15px/600, lh 1.3) over "After your first trip, Go suggests people you’ve travelled with" (13px muted).
- **Fixed bottom CTA region** [`FadeDock variant=blur`]: absolute left/right/bottom 0, padding `70px 16px 24px`, column gap 10.
  - Progressive-blur stack [`ProgressiveBlur`] (4 absolute layers, pointer-events none):
    1. `backdrop-filter blur(3px)`, mask `linear-gradient(180deg, transparent 0%, #000 20%)`
    2. `blur(8px)`, mask transparent 10% to #000 35%
    3. `blur(18px)`, mask transparent 22% to #000 55%
    4. Tint `linear-gradient(180deg, rgba(246,247,249,0) 0%, rgba(246,247,249,0.8) 60%, #F6F7F9 100%)`
  - "Next" `<a>` [`Button variant=primary size=xl`]: relative, height 56, radius 999, #000, white 18px/500, ls -0.014em.
  - Helper "Go can share the link for you from the trip chat": centred, 13px muted.
- ShareSheet (conditional) + Toast.
### Sheets / overlays
- **ShareSheet** [`ShareInviteSheet` on `BottomSheet`]: `<sc-if pShare>`, triggered by "Share in WhatsApp group".
  - Wrapper: absolute inset 0, z-index 40.
  - Backdrop: `<button aria-label="Close">`, inset 0, border 0, `background rgba(11,27,63,0.38)`. Tapping it closes the sheet.
  - Panel: `role="dialog" aria-label="Share trip invite" class="enter"`, absolute left/right/bottom 0 with auto height. padding `8px 16px 30px`, radius `28px 28px 0 0`, bg #F6F7F9, `box-shadow 0 -8px 30px rgba(11,27,63,0.18)`, column gap 14.
  - Grabber: 40x5, radius 999, #DDE1E6, centred.
  - **Link preview card** [`Card variant=outline radius=lg`]: padding 12, radius 18, bg #FFF, `border 1px solid #ECEFF3`, gap 12.
    - img 44 (radius 12, bg #FFF1DC; Goa illustration).
    - "Join Goa crew on Go" (15px/600) over "go.vestra.ai/t/goa-k7q" (13px muted).
    - "Copy" button: height 36, padding 0 12, radius 999, bg #F4F5F7, 13px/600 ink.
  - **Recent-chat row** [`Card variant=outline radius=lg` button] `<a>`: padding 10px 12px, radius 18, bg #FFF, border 1px #ECEFF3, gap 12.
    - 44 circle (bg #FFF1DC, 🌴 20px) with a WhatsApp badge dot (18px #25D366, `border 2px #FFF`, at right -2 / bottom -2).
    - "Goa crew 🌴" (15px/600) over "WhatsApp group · recent" (13px muted), then a chevron.
  - **App row** [5 × `Button variant=ghost` tile targets] (space-between, 5 targets): each is 64 wide, column gap 6. Tile 56x56, radius 18, `border 1px solid #ECEFF3`, emoji 24px. Label 12px/600 ink.
    - WhatsApp: `<a>`, tile bg #25D366, chat-bubble svg 28 with stroke #FFFFFF.
    - 💬 Messages, ✉️ Gmail, 🔗 Copy link, ⋯ More: `<button>`, tile bg #FFFFFF.
  - There is no explicit close button. The sheet closes on backdrop tap or after an app action.
- Toast: z 60, sits above the sheet.
### State & interactions (from the DCLogic script)
- State: `pShare:false`, `pT:null`.
- `pa_0`: Share in WhatsApp group sets `pShare:true`.
- `pa_1`: link-field Copy shows the toast "Invite link copied".
- `pa_2`: Messages shows the toast "Opens Messages with the link filled in" and closes.
- `pa_3`: Gmail shows the toast "Opens Gmail with the link filled in" and closes.
- `pa_4`: Copy link shows the toast "Invite link copied" and closes.
- `pa_5`: More shows the toast "Opens your phone’s share menu" and closes.
- `pa_6`: backdrop closes.
- `pa_7`: sheet link-card Copy shows the toast "Invite link copied". The sheet stays open.
### Navigation
| element | target |
|---|---|
| Back | `P-Home-Zero.dc.html` |
| Skip | `P-Chat-GoA.dc.html` |
| Next | `P-Chat-GoA.dc.html` |
| Sheet: "Goa crew 🌴" recent row | `P-WA-Compose.dc.html` |
| Sheet: WhatsApp tile | `P-WA-Pick.dc.html` |
| Messages / Gmail / Copy link / More / Copy | toast (+ close) |
### Data shown (seed values)
- Destination: Goa. Crew name: "Goa crew". WA group: "Goa crew 🌴".
- Invite URL: `go.vestra.ai/t/goa-k7q`. Share card title: "Join Goa crew on Go".
- Members: just you (Aarav avatar) plus 3 empty slots.
### Icons & images
- SVGs:
  - arrow-left: 22, sw 2.
  - plus: 20, sw 2, #A5ACB8.
  - link (two chain arcs `M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1` + `M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1`): 18, sw 2, #4A5878.
  - copy (`rect x9 y9 12x12 rx2` + `M5 15V5a2 2 0 0 1 2-2h10`): 16, sw 2, ink.
  - chat-bubble (Feather message-circle `M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z`): 20 white on the CTA; 28 white on the green tile. This stands in for the WhatsApp logo.
  - chevron-right: 16, sw 2.4, #A5ACB8.
- Emoji: 👥, 🌴, 💬, ✉️, 🔗, ⋯ (text glyph).
- img: `c58d972a` avatar 52; `63e0220f` Goa illustration 44 in the sheet.

---

## P-Share.dc.html — B2 · Share sheet · invite link · new (doc title "Go — Who's coming, empty")
### Purpose (1 line)
B1 with the ShareSheet already open.
### Layout top→bottom
- Byte-identical to P-Who-Zero except for 2 lines (verified with `diff`). Underneath is the full B1 layout; on top is the open ShareSheet.
### Sheets / overlays
- ShareSheet open on load. Same spec as B1.
### State & interactions (from the DCLogic script)
- Initial `pShare: **true**`. The `pa_0`..`pa_7` handlers are the same as B1. Closing the sheet reveals B1's content in place.
### Navigation
| element | target |
|---|---|
| Back (under the sheet) | `P-Who-Zero.dc.html` (B1 goes to `P-Home-Zero`) |
| Skip / Next | `P-Chat-GoA.dc.html` |
| Recent "Goa crew 🌴" row | `P-WA-Compose.dc.html` |
| WhatsApp tile | `P-WA-Pick.dc.html` |
### Data shown (seed values)
- Same as B1.
### Icons & images
- Same as B1.

---

## P-Who-Link.dc.html — B6 · Who’s coming, link (doc title "Go — Who's coming · no invite count (v2)")
### Purpose (1 line)
B1 after friends have joined via the link: a live crew list and a "Next · open trip chat" CTA.
### Layout top→bottom
- Top bar is the same as B1 (Back, spacer, Skip #A44F3A).
- Scroll region is the same container (padding `0 16px 200px`).
  - h1 "Who’s coming to Goa?" (same as B1).
  - p "Drop the link in your group chat. Whoever taps it shows up here." (same style).
  - **Invite card**: same shell as B1, with:
    - The **same avatar cluster**: you plus 3 dashed "+" placeholders. It is unchanged even though 2 people have joined.
    - Title "Rahul and Priya are in".
    - Body "Share again anytime. Whoever taps the link joins Goa crew."
    - The same link field, Copy button and "Share in WhatsApp group" CTA.
  - (No suggestions placeholder.)
  - **Section header** [`SectionHeader`] (margin-top 24, padding 0 4, baseline, space-between): "Goa crew · 3 in" (20px/600, ls -0.018em) with right label "Updates live" (13px/600 muted).
  - **Member list card** [`CrewList` = `ListCard`/`ListRow` + `LiveDot` 7] (wrapper margin-top 8): padding `0 14px`, radius 22, bg #FFF, card-shadow, column. Rows are non-tappable `div`s: padding 10px 0, gap 12, dividers between them.
    - Row parts: avatar 44 round, then a name (16px/600, ls -0.011em, lh 1.3) over a status line (13px).
    1. You / "Organizer" (muted)
    2. Rahul Verma / green status: an inline-flex (gap 6) with a 7px dot #16A34A and "Joined via link · 2m ago" in #0F7A37, weight 500.
    3. Priya Nair / green status "Joined via link · just now".
- **Fixed bottom CTA region** [`FadeDock variant=blur`]: same blur stack and padding as B1, but **gap 12**.
  - "Next · open trip chat": height 56, black, 18px/500.
  - No helper caption.
- ShareSheet (same as B1, starts closed) + Toast.
### Sheets / overlays
- ShareSheet, identical to B1, triggered by "Share in WhatsApp group".
### State & interactions (from the DCLogic script)
- Identical to B1 (`pShare:false`; `pa_0`..`pa_7` with the same toasts and close behaviour).
- There is no "live" animation, even though the header says "Updates live" (`.live` is defined in the CSS but unused).
### Navigation
| element | target |
|---|---|
| Back | `P-Who-Zero.dc.html` |
| Skip | `P-Chat-GoA.dc.html` |
| Next · open trip chat | `P-Chat-GoA.dc.html` |
| Sheet recent row | `P-WA-Compose.dc.html` |
| Sheet WhatsApp tile | `P-WA-Pick.dc.html` |
### Data shown (seed values)
- Crew: You (Organizer, avatar `c58d`); Rahul Verma (`cb0a`), joined via link 2m ago; Priya Nair (`234f`), joined via link just now.
- Count "Goa crew · 3 in".
- Link `go.vestra.ai/t/goa-k7q`.
### Icons & images
- Same SVGs as B1.
- Avatars 44 in the list. Status dot is a CSS circle, not an icon.

---

## P-Trip-Invite.dc.html — B7 · Friend taps the link · join Goa crew · updated (doc title "Go — Accept invite · no invite count (v2)")
### Purpose (1 line)
Invitee's view: a fixed bottom sheet "Rahul invited you" (Accept & join / Not now) over a dimmed, skeleton Goa trip home.
### Layout top→bottom
- **Background: trip-home skeleton** [`TripHomeSkeleton`] (under the backdrop):
  - **Hero**: relative, flex-shrink 0, height 250, bg #E9945A.
    - Photo img (cover).
    - Scrim `linear-gradient(180deg, rgba(11,27,63,0.22) 0%, rgba(11,27,63,0) 26%, rgba(11,27,63,0.08) 42%, rgba(11,27,63,0.4) 62%, rgba(11,27,63,0.72) 100%)`.
    - Back button [`GlassIconButton`]: absolute top 46 / left 14, 40x40, radius 999, `background rgba(11,27,63,0.35)`, `backdrop-filter blur(12px)`, white arrow-left 22.
    - Share button [`GlassIconButton`] `role=button`: absolute top 46 / right 14, same glass, white share-forward icon 20.
    - Title block: absolute left 20 / right 20 / bottom 44, flex align-end, space-between, gap 12, white.
      - Left column: "📍" (30px in a 30px box) + "Goa" (44px/700, ls -0.03em, lh 1).
      - Meta lines (gap 2, margin-top 4, 15px/500, ls -0.008em, nowrap, emoji in an 18px box): "📅 Diwali · 6–9 Nov" and "👥 3 joined".
      - Right (padding-bottom 2): avatar stack [`AvatarStack`] of 28px avatars, `border 2px #FFF`, overlap -8 [Aarav, Rahul, Priya].
  - **Tab bar** [`TripTabs variant=hero`] (`role=tablist`, "Trip sections"): relative, z 2, margin `-26px 16px 0` (overlaps the hero), padding 5, gap 2, radius 999, bg #FFF, `box-shadow 0 1px 2px rgba(11,27,63,0.06), 0 8px 24px rgba(11,27,63,0.12)`.
    - Tabs are `<a role=tab>`, flex 1, height 42, radius 999, 15px/600, ls -0.008em.
    - Selected tab: bg #000, white. Others: transparent, muted.
    - Labels: Home (selected), Itinerary, Bookings, Expenses.
  - **Body skeleton** [2 × `Skeleton`] (scroll, padding `16px 16px 120px`, gap 10): two empty white blocks, height 76 / radius 22 and height 210 / radius 22.
- **Backdrop** [`BottomSheet` overlay]: `<a aria-label="Close sheet">`, absolute inset 0, z 5, `background rgba(11,27,63,0.38)`.
- **Invite sheet** [`InviteSheet`] (see below).
- ShareSheet (conditional, z 40) + Toast.
### Sheets / overlays
- **Invite sheet** [`InviteSheet` on `BottomSheet`]: `role="dialog" aria-label="Rahul invited you"`.
  - Position: absolute left/right/bottom 0, **top 376, height 536**, z 6. Column flex, radius `28px 28px 0 0`, bg #F6F7F9, `box-shadow 0 -8px 30px rgba(11,27,63,0.18)`.
  - No `.enter` class, so it renders static (no entry animation).
  - Grabber: margin-top 8, 40x5, #DDE1E6.
  - Inner scroll (`flex:1; overflow-y:auto`): padding `8px 16px 140px`, column gap 12.
    - **Header block** [`SheetHeader`] (padding 0 4, gap 2):
      - Row (space-between, gap 12): avatar 36 (Rahul) and "Rahul invited you" (22px/600, ls -0.02em, lh 1.3), gap 10 between them.
      - Close X: 40x40, radius 999, bg #FFF, `box-shadow 0 1px 3px rgba(0,0,0,0.08)`, margin-right -6, X icon 18.
      - Sub "Join the trip to plan it together with Go.": 14px muted, ls -0.004em, lh 1.4.
    - **Trip card** [`Card variant=shadow radius=2xl` + `AvatarStack`]: padding 14, radius 22, bg #FFF, card-shadow, gap 12.
      - Photo 76x76, radius 16, cover ("Goa beach").
      - Title "Goa crew" (20px/600, ls -0.018em, lh 1.2).
      - "Diwali · Fri 6 – Mon 9 Nov" (13px muted).
      - Avatar stack of 22px avatars (`border 2px #FFF`, overlap -7) [Rahul, Priya, Aarav], then "Rahul, Priya and 1 more are in".
    - **"When you join" card** [`ListCard` + `Eyebrow` + `ListRow`]: padding `4px 16px`, radius 22, bg #FFF, card-shadow.
      - Section label "WHEN YOU JOIN": padding `10px 0 4px`, 11px/700 muted, **ls 0.08em**, uppercase as typed.
      - Rows: padding 10px 0, gap 12, dividers between rows, emoji 16px in a 20px box, text 15px.
        - 💬 "You’re added to the trip chat"
        - 📅 "Go asks your dates and budget"
        - 🔒 "Your bookings and budget stay private"
  - **Sheet footer** [`SheetFooter`] (fixed inside the sheet): absolute bottom 0, padding `40px 16px 24px`, column gap 10, bg `linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`.
    - "Accept & join" [`Button variant=primary size=xl`]: primary black pill, height 56, 18px/500.
    - "Not now" text link [`Button variant=link`]: height 48, #A44F3A, 16px/600.
- **ShareSheet** [`ShareInviteSheet`]: same markup as B1, opened by the hero Share button.
### State & interactions (from the DCLogic script)
- State: `pShare:false`, `pT:null`.
- Handler indices are shifted relative to B1:
  - `pa_0`: hero Share sets `pShare:true`.
  - `pa_1`: Messages shows the toast "Opens Messages with the link filled in" and closes.
  - `pa_2`: Gmail shows the toast "Opens Gmail with the link filled in" and closes.
  - `pa_3`: Copy link shows the toast "Invite link copied" and closes.
  - `pa_4`: More shows the toast "Opens your phone’s share menu" and closes.
  - `pa_5`: share backdrop closes.
  - `pa_6`: link-card Copy shows the toast "Invite link copied".
- The hero Share/Back buttons sit under the z5 backdrop, so in practice the ShareSheet (and hero Back) cannot be reached while the invite sheet is up.
### Navigation
| element | target |
|---|---|
| hero Back (covered by backdrop) | `P-App-Home.dc.html` |
| hero Share (covered) | opens ShareSheet |
| tabs Home / Itinerary / Bookings / Expenses (covered) | `P-TripHome-Zero` / `P-Itin-Zero` / `P-Bookings-Zero` / `P-Budget-Zero` |
| backdrop | `P-WA-Chat.dc.html` |
| sheet Close X | `P-WA-Chat.dc.html` |
| Accept & join | `P-TripHome-Zero.dc.html` |
| Not now | `P-WA-Chat.dc.html` |
| ShareSheet recent row / WhatsApp tile | `P-WA-Compose` / `P-WA-Pick` |
### Data shown (seed values)
- Inviter Rahul (`cb0a`).
- Trip "Goa crew", Goa, "Diwali · 6–9 Nov" / "Diwali · Fri 6 – Mon 9 Nov".
- "3 joined"; hero avatars Aarav, Rahul, Priya; "Rahul, Priya and 1 more are in".
- Hero photo `1d74f508` "Palm silhouette against a Goa sunset over the sea" (fallback bg #E9945A).
- Card photo `5bfbb197` "Goa beach".
- Share link `go.vestra.ai/t/goa-k7q`.
### Icons & images
- SVGs:
  - arrow-left: 22, sw 2, white.
  - share-forward (`M14 5l7 7-7 7` + `M21 12h-9a8 8 0 0 0-8 8`): 20, sw 2, white.
  - close X (`M6 6l12 12` + `M18 6L6 18`): 18, sw 2, ink.
  - ShareSheet icons: same as B1.
- Emoji: 📍 📅 👥 💬 🔒 (plus the ShareSheet set).
- img: hero full-bleed 420x250 cover; card 76x76; avatars 28 / 36 / 22.

---

## P-Trip-Invite-Bali.dc.html — G1 · Bali invite from app home · join · new (doc title "Go — Accept invite · no invite count (v2)")
### Purpose (1 line)
B7 template re-used for the Bali invite accepted from App home (A6).
### Layout top→bottom
- Identical to B7 except for the lines `diff` reports:
  - Hero city "**Bali**".
  - Hero meta "📅 **Christmas · 25–28 Dec**" and "👥 **2 joined**".
  - Dialog aria-label and title "**Priya invited you**".
  - Trip card: title "**Bali crew**", date "**Christmas · Fri 25 – Mon 28 Dec**", member line "**Priya and Kabir are in**".
- Unchanged leftovers from B7, which are likely template residue:
  - Hero photo is still the Goa sunset (alt text says Goa).
  - Card photo is still "Goa beach".
  - The header avatar next to "Priya invited you" is still Rahul's `cb0a`.
  - The hero avatar stack is still 3 (Aarav, Rahul, Priya) even though it says "2 joined".
  - The card avatar stack is still [Rahul, Priya, Aarav], while A6 shows Priya + Kabir (`69bf`).
  - The ShareSheet still says "Join Goa crew on Go" / `goa-k7q` / "Goa crew 🌴".
  - Tabs still go to the Goa zero screens.
  - The "When you join" rows are unchanged.
### Sheets / overlays
- Same invite sheet (top 376, height 536) and ShareSheet as B7.
### State & interactions (from the DCLogic script)
- Identical to B7 (`pa_0`..`pa_6`).
### Navigation
| element | target |
|---|---|
| backdrop | `P-App-Home.dc.html` |
| sheet Close X | `P-App-Home.dc.html` |
| Not now | `P-App-Home.dc.html` |
| hero Back (covered) | `P-App-Home.dc.html` |
| **Accept & join** | `P-Chat-Visa.dc.html` (Bali goes into the visa chat flow, not TripHome-Zero) |
| tabs (covered) | `P-TripHome-Zero` / `P-Itin-Zero` / `P-Bookings-Zero` / `P-Budget-Zero` |
| ShareSheet recent row / WhatsApp tile | `P-WA-Compose` / `P-WA-Pick` |
### Data shown (seed values)
- Bali crew. Inviter Priya. Christmas, Fri 25 – Mon 28 Dec. 2 joined. Priya and Kabir are in.
### Icons & images
- Same as B7.

---

## Group notes

### Shared elements (same markup repeated)
- **Global helmet CSS (motion tokens)**. Every file has `--ease-out: cubic-bezier(0.23,1,0.32,1)`.
  - Press on `a` and `button`: `:active` gives `scale(0.97)`, with a 160ms transform transition. Shadow, background and opacity transitions run at 180ms ease, shortened to 60ms while active.
  - Pressed **black** background: overlay `inset 0 0 0 999px rgba(255,255,255,0.18)`.
  - Pressed **light** backgrounds (#F2F2F2 / #F4F5F7 / #F6EAE6 / #FFFFFF / transparent), excluding `.row`: overlay `inset … rgba(11,27,63,0.07)`.
  - Links with no background: opacity 0.6 when pressed.
  - Fine-pointer hover on links: colour #22365F.
  - These rules target inline-style substrings (`[style*="background: #000000"]`). Map them to button-variant classes.
  - `.row`: `:active` gives `scale(0.985)` and `background-color #F5F6F8 !important`.
  - `.enter`: on mount, opacity 0 → 1 and translateY 6px → 0, 220ms ease-out (`@starting-style`).
  - `.tick` (defined, not used in this group): scale 0.8 → 1, 200ms.
  - `.live` (defined everywhere except Main, not used in this group): `box-shadow 0 0 0 7px rgba(22,163,74,0.12)` pulse at 50%, 1600ms infinite.
  - `.knob` translate: defined **only** in P-Main.
  - `prefers-reduced-motion`: scaling is removed and transitions become 150ms opacity fades.
  - `[role=dialog]>div>*{flex-shrink:0}`
  - `input::placeholder{color:#4A5878}`
- **Toast** [sonner `Toaster` / `toastGo`]: `<sc-if pToast>`. `div.enter role=status`.
  - Position: absolute, left 50%, translateX(-50%), **bottom 108**, z 60.
  - Box: max-width 340, padding 12px 16px, radius 16, bg #0B1B3F.
  - Text: white 14px/600, lh 1.35, centred.
  - Shadow: `0 10px 30px rgba(11,27,63,0.3)`.
  - Behaviour: `_toast(t)` sets the text and auto-clears after **2200 ms**; a new toast resets the timer.
- **Primary black pill button** [`Button variant=primary` xl/lg/base]: radius 999, bg #000000, #FFFFFF, `letter-spacing -0.014em`. Sizes in use:
  - **56 / 18px / 500**: Welcome, Create a trip, Next, Accept & join.
  - 52 / 16px / 500: Share in WhatsApp group.
  - 44 / 15px / 500: invite Accept.
  - FAB: 56 / **17px / 600**, with shadow `0 8px 24px rgba(11,27,63,0.25)`.
- **Terracotta text link** [`Button variant=link`]: #A44F3A, 600 (Skip 15px, height 36; Not now 16px, height 48).
- **Back arrow button** [`Button variant=ghost size=icon` / `GlassIconButton`]:
  - Default: 44x44 round, arrow-left 22 sw 2, ink.
  - Glass variant on photos: 40x40, `rgba(11,27,63,0.35)` + blur 12, white icon.
- **Screen title stack** [`ScreenTitle`] ("eyebrow + 34px title"): eyebrow 13px/600 muted; title 34px/600, ls -0.025em, lh 1.12.
- **Section header row** [`SectionHeader`]: 20px/600, ls -0.018em, lh 1.3, with an optional right meta (13px/600 muted). padding 0 4, `align-items baseline`, typically margin-top 14 (24 on B6).
- **Card** [`Card variant=shadow`]: bg #FFF, card-shadow. Radius by role: 22 (lists/rows), 24 (trip cards, identity), 28 (hero/invite cards), 20 (idea cards).
- **Settings/list row** [`ListRow`]: padding 13px 0 (settings) or 10px 0 (lists), gap 12, divider `1px #ECEFF3` between rows. Title 15–16px/600, subtitle 13px muted with ls 0.002em and lh 1.35, trailing chevron 16 #A5ACB8 sw 2.4.
- **Emoji icon bubble** [`EmojiTile`]: 36 round, #F4F5F7, emoji 16 (Profile). Variant: 40 round white, emoji 18 (B1).
- **Avatar stack** [`AvatarStack`]: round imgs with `border 2px solid #FFF`, negative margin-left, and a matching padding-left on the wrapper. Sizes/overlaps: 20 / -6, 22 / -7, 26 / -8, 28 / -8. The B1/B6 cluster uses 52 / -14 with a 3px border.
- **Dashed placeholder avatar** [`DashedAvatar`]: 52, `2px dashed #CDD3DC`, bg #F6F7F9, plus icon #A5ACB8.
- **Section label (uppercase)** [`Eyebrow`]: 11px/700 muted, **ls 0.08em**. Only "WHEN YOU JOIN" in this group.
- **Link field + Copy chip** [`InviteLinkField`] (B1/B6), and the **ShareSheet** [`ShareInviteSheet`] (B1/B2/B6/B7/G1). Same markup each time; only the handler indices differ in B7/G1.
- **Bottom sheet chrome** [`BottomSheet`]: radius `28px 28px 0 0`, bg #F6F7F9, `box-shadow 0 -8px 30px rgba(11,27,63,0.18)`, grabber 40x5 #DDE1E6, backdrop `rgba(11,27,63,0.38)`.
- **Progressive-blur bottom CTA dock** [`FadeDock variant=blur` + `ProgressiveBlur`] (B1/B6): 4 layers at blur 3/8/18 plus a tint. App-Home uses a simpler 120px gradient fade instead.
- **Avatar identity map** (inferred from usage):
  - `c58d972a` = Aarav Shah (you)
  - `cb0a34fd` = Rahul Verma
  - `234f094a` = Priya Nair
  - `69bfc542` = Kabir
  - `8c7b7cb2` = unnamed 4th Goa member
  - `5bda4ac2` = Go assistant avatar (shown on #DCEBFF)
- **Illustration map**:
  - `63e0220f` Goa
  - `263733bd` Coorg
  - `4ff20859` Gokarna hut (also used for Bali)
  - `71c060d1` Jaipur
  - `62855067` Pondy
  - `b5284f60` Hampi
  - `f6048aa7` Go mascot
- **Photos**: `5bfbb197` Goa beach; `1d74f508` Goa sunset hero.

### Sibling-state deltas
- **Who-Zero (B1) vs Share (B2)**: two lines differ. B2 starts with `pShare:true` and its Back goes to `P-Who-Zero` instead of `P-Home-Zero`. Collapse into B1 with `shareOpen` state [`/trips/new` `shareOpen`].
- **Who-Zero (B1) vs Who-Link (B6)**: same screen, "members>0" state.
  - Copy changes: subtitle, card title ("No one’s in yet" becomes "Rahul and Priya are in"), card body.
  - B6 drops the suggestions placeholder and adds the "Goa crew · 3 in / Updates live" member list.
  - CTA label becomes "Next · open trip chat", the helper caption is removed, and the dock gap goes 10 → 12.
  - Back goes to `P-Who-Zero`.
  - The avatar cluster does **not** change (still you plus 3 dashed slots).
  - Collapse into one `WhosComing` screen [`/trips/new` page] driven by `members[]`.
- **Trip-Invite (B7) vs Trip-Invite-Bali (G1)**: same template, with param deltas.
  - Changed: city, date label, joined count, inviter name, crew name, member line.
  - Exits: G1 sends close / backdrop / Not now to `P-App-Home` (B7 sends them to `P-WA-Chat`). Accept goes to `P-Chat-Visa` in G1 and `P-TripHome-Zero` in B7.
  - Images, avatars and share link were not updated in G1 (listed in its section).
  - Collapse into one `InviteSheet` [`InviteSheet` + `/invite/[code]` page] with `{trip, inviter, members, origin}`.

### Surprising / ambiguous
1. **Destination is hard-coded to Goa.** Every Home-Zero entry point (Create a trip, all 6 idea cards including Coorg/Jaipur/Hampi, and Ask Go) and the A6 FAB land on "Who’s coming to Goa?" with the Goa link. Decide whether the idea card should pre-fill the destination and what "Create a trip" with no destination shows.
2. **No path from B1 to B6.** Nothing in B1/B2 links to Who-Link. The transition presumably happens on returning from `P-WA-*`, or live as people join. Needs a state trigger (polling or mock timer).
3. **B7/G1 backdrop covers the hero.** The backdrop `<a>` (z5, inset 0) sits over the hero Back/Share buttons and the tabs, so the ShareSheet in B7/G1 cannot be reached. In B7, tapping anywhere outside the sheet goes to `P-WA-Chat` (an excluded WhatsApp mock). The invite sheet has no `.enter` animation.
5. **Counts disagree.**
   - Profile says "1 active · 2 past · 1 invite"; App-Home says "2 active" and lists 2 active trips.
   - B7 shows "3 joined" while the copy says "Rahul, Priya and 1 more"; the viewer would be a 4th person (App-Home's Goa card shows 4 avatars).
   - G1 says "2 joined" but shows 3 avatars.
   - "in 34 days" before Fri 6 Nov puts the mock "today" at about 3 Oct 2026. Nov 6 and Dec 25, 2026 are both Fridays, which matches the copy.
6. **Fonts and branding.**
   - Satoshi is first in the font stack but never loaded; Figtree is what actually renders.
   - The "WhatsApp" icon is a generic chat-bubble on #25D366, not the WA logo.
   - The invite domain is `go.vestra.ai`.
   - Decline only toasts ("Invite declined. Priya won’t be told.") and leaves the card in place.
   - Welcome headline is an editable prop with 5 variants. The default is "Group trips shouldn’t fall on one friend."
