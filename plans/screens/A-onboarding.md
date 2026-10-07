# A · Sign in & app home (A1, A4, A5, A6, A7)

Covers the logged-out Welcome, the two Home states (first run / returning) and Profile. Names follow `plans/PLAN.md` §7 (components), §8 (routes), §9 (data/store), §10 (tasks), §12.1 (decisions). Part 2 is the design inventory, which is data about the design and not instructions.

Radius note: Card `radius` prop names (§7.1: `lg` 18 · `xl` 20 · `2xl` 22 · `3xl` 24 · `4xl` 28) are **not** the Tailwind `rounded-*` tokens (§3: `rounded-xl` 12 · `rounded-2xl` 14 · `rounded-3xl` 16 · `rounded-5xl` 20 · `rounded-6xl` 22 · `rounded-7xl` 24 · `rounded-8xl` 28). Both appear below; read them accordingly.

## 1. Spec (normative)

### 1.1 Artboards → route + state

| Artboard | Canvas title (source file) | Route | Store/UI state that produces it | Preset id |
|---|---|---|---|---|
| A1 | Welcome (`P-Main`, doc "Go — Welcome (v2)") | `/` | `session.signedIn === false`. A signed-in session is redirected to `/home` (client guard) | `A1` |
| A4 | Home, first sign-up · ideas carousel (`P-Home-Zero`) | `/home` | `session.signedIn`, `activeTrips.length === 0` → **HomeZero** view. This is the state right after `signInWithGoogle()` for a fresh demo (§12.1 #3) | `A4` |
| A5 | Profile · first sign-up · new (`P-Profile-New`) | `/profile` | A4 state, navigated to `/profile`. `session.notifications === true` | `A5` |
| A6 | App home · your trips + invites (`P-App-Home`) | `/home` | `activeTrips = [goa, college]`, `pendingInvites = [bali-x9m]`, `trips.pastTrips` = 2 → **AppHome** view. Seeded organically by `createDraftGoa()` (B1) or by the preset. Preset `A6` also sets `goa` to stage `planned` so the Goa card opens J1 as in the design | `A6` |
| A7 | Profile · from app home · new (`P-Profile`) | `/profile` | A6 state, navigated to `/profile` | `A7` |

Definitions used throughout:
- `activeTrips` = `Object.values(trips.trips).filter(t => t.memberIds.includes(session.userId))`, in seed order (goa, college, then bali once accepted). PLAN §8's "`trips.length === 0`" means `activeTrips.length === 0`: the Bali trip record exists before acceptance, but the user is not a member.
- `pendingInvites` = `trips.invites.filter(i => !trips.trips[i.tripId]?.memberIds.includes(session.userId))`.
- A5 and A7 render identically. Only the Back destination differs, and that falls out of state (`/home` renders A4 or A6).
- A2/A3 (Google chooser/consent) are excluded (PLAN §8.1).

Guards: `/home` and `/profile` with `session.signedIn === false` → `router.replace('/')`. The one exception is `/home?preset=<id>`, which applies the preset first. All three pages render only after `useHydrated()`; until then they show an empty frame (`bg-canvas`; on Welcome, `bg-white`).

### 1.2 Screen anatomy per route

#### `/` — Welcome (A1)
Root: `Screen scroll="none"` with `relative flex h-full flex-col overflow-hidden px-6 pb-safe bg-linear-to-b from-[#FFFBFA] from-0% via-[#FFFDFC] via-30% to-white to-55%`. Nothing scrolls. Sections, back to front, then top to bottom:

1. **`WelcomeOrbit`** (screen-local, aria-hidden decorations plus alt-texted images). Box: `absolute left-1/2 top-0 h-[504px] w-[420px] -translate-x-1/2 origin-top [@media(max-height:879px)]:scale-[0.88] [@media(max-height:779px)]:scale-[0.74]`. The box is the 420-wide artboard, so the coordinates below are artboard px. DOM order:
   - a. Dashed ring: `absolute left-[60px] top-[150px] size-[300px] rounded-full border-[1.5px] border-dashed border-go-ring`.
   - b. Glow: `absolute left-[98px] top-[188px] size-[224px] rounded-full bg-[radial-gradient(closest-side,var(--color-go-glow)_0%,rgb(251_233_226/0.6)_55%,rgb(251_233_226/0)_100%)]`.
   - c. Six orbit items. Each is `absolute flex w-20 flex-col items-center animate-rise` plus a delay class. The img is `size-[68px] drop-shadow-[0_6px_8px_rgb(164_79_58/0.12)]` (alt from seed). The label is `mt-0.5 text-12 font-semibold leading-[1.3] tracking-[0.01em] text-muted`.

     | i | label | left / top | delay class |
     |---|---|---|---|
     | 0 | Manali | 170 / 116 | `[animation-delay:0ms]` |
     | 1 | Kerala | 300 / 191 | `[animation-delay:60ms]` |
     | 2 | Jaipur | 300 / 341 | `[animation-delay:120ms]` |
     | 3 | Gokarna | 170 / 416 | `[animation-delay:180ms]` |
     | 4 | Udaipur | 40 / 341 | `[animation-delay:240ms]` |
     | 5 | Ladakh | 40 / 191 | `[animation-delay:300ms]` |

     If Tailwind's utility ordering lets the `animate-*` shorthand override an arbitrary `[animation-delay:…]` or `[animation-duration:…]`, set `animationDelay`/`animationDuration` through `style` instead. The values are index-derived, so this counts as dynamic and is allowed.
   - d. Ground shadow: `absolute left-[165px] top-[384px] h-3 w-[90px] rounded-[50%] bg-[radial-gradient(closest-side,rgb(11_27_63/0.18),rgb(11_27_63/0))]`.
   - e. Mascot `<img>`: `absolute left-[170px] top-[208px] h-[182px] w-20 animate-rise-slow`, alt "Go, a waving traveller holding a map".
   - f. **`GlassStatusPill variant="progress"`** with `absolute left-[232px] top-[284px] w-40 [animation-delay:420ms]`. It is a `Card variant=glass` (bg-white/86, backdrop-blur 10px, white border, shadow-glass) with `rounded-3xl` (16px) and `flex flex-col gap-2 px-3 py-2.5 animate-rise [animation-duration:420ms]`. The first row is `flex items-center gap-2 whitespace-nowrap text-13 font-semibold tracking-caption`, holding `Spinner` (14px) and "Comparing 24 stays". Below it, `Progress value={62}` (track `h-1 rounded-full bg-success-soft`, bar `bg-success origin-left animate-fill`).
   - g. **`GlassStatusPill variant="done"`** with `absolute left-[26px] top-[300px] [animation-delay:540ms]`. It is a `Card variant=glass` with `h-[38px] rounded-full pl-2.5 pr-3.5 flex items-center gap-2 whitespace-nowrap text-13 font-semibold tracking-caption animate-rise [animation-duration:420ms]`, holding `CheckBadge size=18` and "Cabs sorted for 6".
2. **Copy block**: `relative mt-auto flex flex-col items-center gap-2.5 text-center`.
   - `<h1>`: `text-34 leading-[1.15] font-semibold tracking-title text-ink text-balance`, showing the headline.
   - `<p>`: `max-w-[350px] text-16 leading-[1.45] tracking-body text-muted text-pretty`, showing the subline.
3. **`FeatureTrio`**: `relative mt-[22px] flex gap-2`. Each of the 3 cells is `flex flex-1 flex-col items-center gap-1.5`, holding `EmojiTile size=44 shape=rounded-2xl` with `bg-white shadow-card` (emoji `text-20`, aria-hidden) and a label `text-center text-13 font-semibold leading-[1.3] text-muted`.
4. **CTA block**: `relative mt-[22px] flex flex-col gap-2.5`.
   - **`GoogleButton`**: `Button variant=primary size=xl` with `w-full gap-2.5` (56px, 18/500, tracking-h4). Content: `<img src="/icons/brand/google.svg" alt="" className="size-5">` and "Continue with Google".
   - **`LegalLine`**: `<p className="mt-0.5 text-center text-13 leading-[1.4] text-muted">` reading "By continuing you agree to our Terms and Privacy Policy". "Terms" and "Privacy Policy" are inline `<button type="button">` elements with `font-semibold text-ink underline active:opacity-60 [@media(pointer:fine)]:hover:text-ink-hover`.
5. Toasts come from the global `<Toaster>` (offset 108). The page renders nothing for them.

#### `/home` — HomeZero (A4) and AppHome (A6)
Shell: `Screen` (`flex h-full flex-col bg-canvas`). The header is shrink-0. The scroll region is `flex-1 min-h-0 overflow-y-auto scrollbar-none`. `app/home/page.tsx` renders the header, then `<HomeZeroView/>` or `<AppHomeView/>`.

**Header** (both states): a wrapper `shrink-0 flex items-center justify-between gap-3 px-5` containing `ScreenTitle eyebrow=… title="Your trips" trailing={…}`.
- ScreenTitle: column gap-0.5. Eyebrow `text-13 font-semibold tracking-caption text-muted`; title `text-34 font-semibold tracking-title` (lh 1.12).
- Trailing: `<Link href="/profile" aria-label="Your profile" className="flex size-11 items-center justify-center rounded-full">` around `Avatar size=40` (the signed-in user).
- A4: eyebrow "Welcome to Go", wrapper `pt-[max(60px,env(safe-area-inset-top))]`, no bottom padding.
- A6: eyebrow "Welcome back", wrapper `pt-safe pb-2` (56).

**HomeZeroView (A4)**. Scroll inner: `flex flex-col gap-2.5 px-4 pt-4 pb-10`.
1. **`HeroCard`**: `Card variant=shadow radius=4xl` with `relative flex flex-col gap-3.5 overflow-hidden px-5 pt-[22px] pb-5 bg-linear-to-b from-go-note to-white to-70%`.
   - Ring: `absolute -right-10 -top-[30px] size-[210px] rounded-full border-[1.5px] border-dashed border-go-ring`.
   - Glow: `absolute -right-1.5 top-1 size-[140px] rounded-full bg-[radial-gradient(closest-side,var(--color-go-glow),rgb(251_233_226/0))]`.
   - Mascot img: `absolute right-[34px] top-3.5 h-[132px] w-[58px]`.
   - Title: `relative max-w-[230px] text-26 font-semibold tracking-[-0.022em] text-balance`.
   - Body: `relative max-w-[240px] text-15 leading-[1.4] tracking-sub text-muted text-pretty`.
   - CTA wrapper: `relative mt-1 flex flex-col gap-2`, holding `Button asChild variant=primary size=xl` (a `<Link href="/trips/new">`) with `Plus className="size-5"` and "Create a trip".
2. **`SectionHeader title="Ideas for your crew" meta="From Bengaluru"`** with `mt-3.5`. SectionHeader styling: `flex items-baseline justify-between px-1`, title 20/600 tracking-h3 leading-[1.3], meta 13/600 tracking-caption muted.
3. **`IdeasCarousel`**: `-mx-4 flex gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-px-4 pt-0.5 pb-2`, with an aria-hidden `w-1.5 shrink-0` spacer at both ends. It holds 6 **`IdeaCard`**s, each a `Card variant=shadow radius=xl` rendered as `<Link>` (via `asChild`, or `cardVariants()` on the Link).
   - Card: `flex w-[150px] shrink-0 snap-start flex-col overflow-hidden transition-[transform,background-color] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.985] active:bg-surface-pressed`.
   - Image well: `flex h-[104px] items-center justify-center {idea.tintClass}`, holding an img `size-[76px]` alt "".
   - Body: `flex flex-col gap-0.5 px-3 pt-2.5 pb-3`. Name `text-16 font-semibold tracking-body leading-[1.3]`. Tag and travel lines are each `text-13 tracking-caption text-muted`; the travel line is `<span aria-hidden>{travelEmoji}</span> {travel}`.
4. **`AskGoRow`**: `Card variant=shadow radius=2xl` rendered as `<Link>`, with `flex items-center gap-3 px-3.5 py-3 active:scale-[0.97] active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]`.
   - Leading: `Avatar size=40 kind=go` (bg-info-soft).
   - Text column `flex flex-1 flex-col gap-0.5`: title `text-16 font-semibold tracking-body leading-[1.3]`, sub `text-13 tracking-caption text-muted`.
   - Trailing: `ChevronRight className="size-4 text-faint" strokeWidth={2.4}`.

There is no toast and no dock.

**AppHomeView (A6)**. Scroll inner: `flex flex-col gap-2.5 px-4 pt-2.5 pb-[130px]`.
1. If `pendingInvites.length`: **`SectionHeader title="Invites" meta="1 new"`** (no top margin).
2. One **`InviteCard`** per pending invite. Card: `Card variant=shadow radius=2xl` with `flex flex-col gap-3 p-3.5`.
   - Top row `flex items-center gap-3`:
     - Thumb `flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-info-tint`, holding an img `size-11`.
     - Text column `flex min-w-0 flex-1 flex-col gap-0.5`: title `text-16 font-semibold tracking-body leading-[1.3]`, sub `text-13 tracking-caption text-muted`, then a member line `flex items-center gap-1.5 text-13 tracking-caption text-muted` = `AvatarStack size=20 overlap=-6 ring=white` + the members line.
   - Button row `flex gap-2`:
     - `Button asChild variant=primary size=base` (`<Link>`) with `flex-1 px-[18px] tracking-h4` → "Accept" (44, 15/500).
     - `Button variant=secondary size=base` with `flex-1 px-3.5 tracking-sm` → "Decline" (44, 15/600, bg-surface-3).
3. **`SectionHeader title="Your trips" meta="2 active"`** with `mt-3.5`.
4. One **`TripCard`** per active trip. Card: `Card variant=shadow radius=3xl` rendered as `<Link>`, with `flex flex-col overflow-hidden` and the same row press classes as IdeaCard.
   - Cover `relative h-32`:
     - photo: `<img className="absolute inset-0 size-full object-cover">`;
     - gradient: `absolute inset-0 bg-linear-160 from-cover-1 via-cover-2 via-45% to-cover-3` plus ring `absolute -right-10 -top-[30px] size-[170px] rounded-full border-[1.5px] border-dashed border-white/45`;
     - then scrim `absolute inset-0 bg-linear-to-b from-ink/0 from-30% to-ink/60`;
     - text `absolute bottom-3 left-3.5 flex flex-col text-white`: title `text-24 font-bold tracking-h2` (lh 1.1), sub `text-14 font-medium`;
     - `AvatarStack size=26 overlap=-8 ring=white max=4` at `absolute bottom-3 right-3`.
   - Footer `flex items-center gap-2.5 px-3.5 py-3`:
     - Column `flex flex-1 flex-col gap-px`. Name `text-16 font-semibold tracking-body leading-[1.3]`. Status `text-13`, styled `font-semibold text-go` (tone `go`) or `tracking-caption text-muted` (tone `muted`).
     - Trailing: `ChevronRight size-4 text-faint strokeWidth 2.4`.
5. If `pastTrips.length`: **`SectionHeader title="Past trips"`** with `mt-3.5` and no meta.
6. A **`ListCard padding=tight`** inside `Card variant=shadow radius=2xl` (2px 14px), holding **`PastTripRow`** × n. Each row is a `ListRow dense` (py-2.5, gap-3, `border-t border-line` between rows), non-interactive.
   - Leading: `flex size-11 items-center justify-center rounded-xl {tintClass}`, holding an img `size-9`.
   - Title `text-15 font-semibold`; sub `text-13 tracking-caption text-muted`.
   - Trailing: `CheckBadge size=22`.
7. Outside the scroll region (child of the relative Screen root): **`FadeDock variant=fade`** with `h-[120px] flex items-end justify-center` (canvas/0 → canvas at 70%, pointer-events on children only, `pb-safe` = 24). Inside it, the **FAB** is a `Button asChild variant=primary size=xl` (`<Link href="/trips/new">`) with `mb-1 px-6 text-17 font-semibold tracking-normal shadow-fab`, containing `Plus size-5` and "New trip". The bottom offset is 24 + 4 = 28.

#### `/profile` — Profile (A5 / A7)
1. **`TopBar title="Profile" onBack={…}`** (`pt-safe pb-2 px-3 gap-1.5`). Back is `Button variant=ghost size=icon` (44) with `ArrowLeft className="size-[22px]" strokeWidth={2}` text-ink and aria-label "Back". The title is `text-20 font-bold tracking-h3`.
2. Scroll inner `flex flex-col gap-3 px-4 pt-2 pb-10`:
   - a. **`IdentityCard`**: `Card variant=shadow radius=3xl` with `flex items-center gap-3.5 p-5`. Contents: `Avatar size=64`, then a column `flex flex-col gap-0.5`:
     - name `text-22 font-semibold tracking-h2`;
     - email `text-13 tracking-caption text-muted`;
     - badge row `flex items-center gap-[5px] text-12 font-semibold text-success-ink` = `CheckBadge size=14` + "Signed in with Google".
   - b. **`SettingsList`**: `ListCard padding=rows` (px-3.5) inside `Card variant=shadow radius=2xl`, holding 4 `ListRow`s.
     - Row metrics: `py-[13px] gap-3`, `border-t border-line` on rows 2–4.
     - Leading: `EmojiTile size=36 shape=circle` on `bg-surface-2`, emoji `text-16`, aria-hidden.
     - Text column `gap-px`: title `text-15 font-semibold`, sub `text-13 tracking-caption text-muted`.
     - Trailing: `ChevronRight size-4 text-faint strokeWidth 2.4`, or a `Switch`.
     - Rows:
       1. 🛫 "Travelling from" / "Bengaluru · used for your tickets": `onClick`, `role="button"`.
       2. 🧳 "Your trips" / "1 active · 2 past · 1 invite": `href="/home"`.
       3. 💳 "Payment methods" / "UPI · HDFC card ••4821": `onClick`.
       4. 🔔 "Trip notifications" / "Polls, bookings, Go’s calls". No href and no onClick, so no press styles. Trailing: `Switch checked={session.notifications} aria-label="Trip notifications"` (52×32, p-1, knob 24, `translate-x-5` when checked, bg-success / bg-line-2).
   - c. **Sign out**: `Button variant=danger-outline size=lg` with `w-full tracking-normal` (52, white, 1px line-2 border, text-danger 16/600).
   - d. **`PrototypeControls`** (§9.6) with `mt-6 flex flex-col gap-2.5`:
     - `SectionHeader title="Prototype controls" meta="Not in the real app"`;
     - a `ListCard padding=rows` with the same row metrics as SettingsList:
       - 🔄 "Reset demo" / "Clears saved progress and signs out", with a chevron.
       - 🧭 "Jump to artboard" / "Pick one of 72 design states". A native `<select aria-label="Jump to artboard" className="absolute inset-0 opacity-0">` is stretched over this row (the row is `relative`). Options are grouped by `<optgroup label="A">`…`"M"`, each labelled `"{id} · {title}"` from `presets.ts`.
     - These strings are prototype-only copy, not design copy. They live in `copy.ts` under `prototype`.
3. Toasts come from the global Toaster.

### 1.3 Data bindings
Components in `home/` are props-only. Pages and views read the store (`src/store`) and seeds (`src/data/seed`), then pass props down. Copy-key names below are indicative: P2-1 owns the `copy.ts` shape, but the strings must match §2 verbatim.

| Section | Reads | Value under seed |
|---|---|---|
| Welcome guard | `session.signedIn` | `false` → render, `true` → `/home` |
| Welcome copy | `copy.welcome.headlines[0]`, `.subline`, `.features[3]`, `.legal`, `.pills`, `.toasts.terms/.privacy` | headline "Group trips shouldn’t fall on one friend." (the other 4 options are stored but unused) |
| WelcomeOrbit | `copy.welcome.orbit[6] {label, img, alt}` (img = `assets.illustrations.<city>`), `assets.goMascot` | Manali, Kerala, Jaipur, Gokarna, Udaipur, Ladakh |
| Home header avatar | `users[session.userId]` (= `users.aarav`): `avatar`, `initials`, `tone` | Aarav |
| HeroCard | `copy.home.hero {title, body, cta}`, `assets.goMascot` | "Start your first group trip" … |
| Ideas header meta | `` `From ${users.aarav.city}` `` | "From Bengaluru" |
| IdeasCarousel | `ideas` (seed `ideas.ts`, 6 × `{id, name, tag, travelEmoji, travel, tintClass, img}`) | Goa … Hampi |
| AskGoRow | `copy.home.askGo {title, sub}`, `assets.goAvatar` | "Not sure where? Ask Go" |
| Invites section | `pendingInvites`; meta `` `${pendingInvites.length} new` `` | 1 → "1 new" |
| InviteCard | `trips.trips[invite.tripId].name`, `invite.cardSub`, `invite.memberIds` → `users[]`, `invite.membersLine`, thumb `assets.illustrations.gokarna` on `bg-info-tint` | "Bali crew" / "Priya invited you · Christmas, 25–28 Dec" / [priya, kabir] / "Priya and Kabir are in" |
| Your-trips section | `activeTrips`; meta `` `${activeTrips.length} active` `` | 2 → "2 active" |
| TripCard | `trip.id` (href), `trip.name`, `trip.memberIds.slice(0, 4)` → `users[]`, `trip.cover` (photo) or gradient when absent, `trip.homeCard {coverTitle, coverSub, status, statusTone}` | goa: "📍 Goa" / "Fri 6 – Mon 9 Nov · in 34 days" / "2 things pending on you" / `go`, members aarav, rahul, priya, arjun (§12.1 #1: first 4). college: "New trip" / "Where and when not decided yet" / "Go is collecting everyone’s answers" / `muted`, members aarav, rahul |
| Past trips | `trips.pastTrips` × `{id, title, sub, tintClass, img}` | Pondy weekend (`bg-amber-tint`, pondy) · Coorg with the college gang (`bg-green-tint`, coorg) |
| IdentityCard | `users.aarav.{name, email, avatar}`, `copy.profile.provider` | Aarav Shah · aarav.shah@gmail.com · "Signed in with Google" |
| SettingsList | `copy.profile.rows` (emoji/title/sub). The Travelling-from sub is `` `${users.aarav.city} · used for your tickets` ``. The Your-trips sub is the literal "1 active · 2 past · 1 invite" (§12.1 #3). The payment sub is the literal "UPI · HDFC card ••4821" | 4 rows |
| Notifications switch | `session.notifications`, `setNotifications(v)` | `true` |
| PrototypeControls | `presets` (ids + titles), `applyPreset(id)`, store reset | 72 ids |

`tintClass` is stored as a full class literal (e.g. `'bg-amber-soft'`) so Tailwind's source scan finds it. Tints: Goa `bg-amber-soft`, Coorg `bg-green-tint`, Gokarna `bg-info-tint`, Jaipur `bg-peach-tint`, Pondy `bg-amber-tint`, Hampi `bg-peach-tint-2`.

Navigation bindings:
- **Idea cards**: all 6 (including Coorg, Jaipur and Hampi), plus "Create a trip" and the Ask-Go row, are `<Link href="/trips/new">` with no destination prefill. `/trips/new` (B-crew, P3-2) always creates or uses the Goa draft via `createDraftGoa()` (§8, §12.1 #2; the design hard-codes Goa).
- **Accept** → `/invite/${invite.code}` = `/invite/bali-x9m` (G1). The invite page performs `acceptInvite`; Home does not.
- **Decline** → toast only. The card stays.
- **Goa crew card** → `/trips/goa`. **College gang card** → `/trips/college`. **FAB** → `/trips/new`.
- **Header avatar** → `/profile`. **Your trips row** → `/home`.
- **Sign out** → `signOut()` → `router.replace('/')`.
- **"Continue with Google"** → `signInWithGoogle()` (lib/auth, resolves after 400ms and calls `session.signIn()`) → `router.replace('/home')`.

### 1.4 Interactions → actions/toasts

| Route / state | Element | Handler | Result (toast text verbatim) |
|---|---|---|---|
| `/` | Continue with Google | `<GoogleButton onSignedIn={() => router.replace('/home')}/>` → `await signInWithGoogle()` | `/home` → A4 for a fresh session |
| `/` | Terms | `toastGo(copy.welcome.toasts.terms)` | "Opens Go’s terms in your browser" |
| `/` | Privacy Policy | `toastGo(copy.welcome.toasts.privacy)` | "Opens Go’s privacy policy in your browser" |
| `/home` (both) | header avatar | `<Link href="/profile">` | A5 (zero) / A7 (trips) |
| `/home` (both) | `?preset=<id>` (once on mount) | `router.replace(applyPreset(id))` | any of the 72 artboards |
| A4 | Create a trip | `<Link href="/trips/new">` | B1 |
| A4 | idea card × 6 | `<Link href="/trips/new">` | B1 (Goa draft) |
| A4 | Not sure where? Ask Go | `<Link href="/trips/new">` | B1 |
| A6 | Accept | `<Link href="/invite/bali-x9m">` | G1 |
| A6 | Decline | `declineInvite('bali-x9m')` (§9.4; the action emits the toast. If P2-2 made it state-only, the handler calls `toastGo`. The toast fires exactly once) | "Invite declined. Priya won’t be told." Card stays |
| A6 | Goa crew card | `<Link href="/trips/goa">` | J1 when planned (preset A6), I1 otherwise |
| A6 | College gang card | `<Link href="/trips/college">` | I1 |
| A6 | New trip FAB | `<Link href="/trips/new">` | B1 |
| A6 | past-trip rows | none (static `div`) | — |
| `/profile` | Back | `window.history.length > 1 ? router.back() : router.push('/home')` | `/home` → A4 or A6 |
| `/profile` | Travelling from | `toastGo(copy.profile.toasts.from)` | "Change it from the From chip in any trip chat" |
| `/profile` | Your trips | `<Link href="/home">` | A4 or A6 by state |
| `/profile` | Payment methods | `toastGo(copy.profile.toasts.payment)` | "Payment methods open here in the real app" |
| `/profile` | Trip notifications switch | `setNotifications(!session.notifications)` | knob slides 20px over 200ms, bg success ↔ line-2. Persisted. The row itself is inert |
| `/profile` | Sign out | `signOut()` then `router.replace('/')` | A1 |
| `/profile` | Reset demo | reset store to initial state + `useStore.persist.clearStorage()`, then `router.replace('/')` | A1, signed out |
| `/profile` | Jump to artboard (select change) | `router.push(applyPreset(id))` | chosen artboard |

### 1.5 Screen-local components (files + props)
Rules:
- `home/` composites are **props-only**: no store imports, no `useRouter`.
- "use client" is used only where a component has handlers.
- Types come from `@/data/types` (`User`, `Idea`, `PastTrip`; see §1.8 for the gaps).

**P3-16** owns these (PLAN §10 list, plus 4 Welcome additions marked ✚, which are not yet in PLAN §10's OWNS list):

| File | Props | Notes |
|---|---|---|
| `src/components/home/WelcomeOrbit.tsx` ✚ | `{ items: { label: string; img: string; alt: string }[]; mascot: { src: string; alt: string }; pills: { progress: { label: string; value: number }; done: { label: string } } }` | Exactly 6 items. Positions and delays are an in-file constant table (§1.2), not props. Renders `GlassStatusPill` × 2 |
| `src/components/home/GlassStatusPill.tsx` ✚ | `{ variant: 'progress' \| 'done'; label: string; value?: number; className?: string }` | Position and delay are passed in `className`. Uses `Card variant=glass`, `Spinner`, `Progress`, `CheckBadge` |
| `src/components/home/FeatureTrio.tsx` ✚ | `{ items: { emoji: string; label: string }[] }` | 3 items |
| `src/components/home/LegalLine.tsx` ✚ | `{ prefix: string; terms: string; joiner: string; privacy: string; onTerms: () => void; onPrivacy: () => void }` | Renders `{prefix}<button>{terms}</button>{joiner}<button>{privacy}</button>`. Strings come from `copy.welcome.legal` ("By continuing you agree to our ", "Terms", " and ", "Privacy Policy") |
| `src/components/home/HeroCard.tsx` | `{ title: string; body: string; ctaLabel: string; ctaHref: string; mascot: { src: string; alt: string } }` | |
| `src/components/home/IdeaCard.tsx` | `{ idea: Idea; href: string }` | `<Link>` |
| `src/components/home/IdeasCarousel.tsx` | `{ ideas: Idea[]; href: string }` | Spacers, snap |
| `src/components/home/AskGoRow.tsx` | `{ title: string; sub: string; href: string }` | |
| `src/components/home/InviteCard.tsx` | `{ title: string; sub: string; members: User[]; membersLine: string; thumb: { src: string; tintClass: string }; acceptHref: string; onDecline: () => void }` | "use client" |
| `src/components/home/TripCard.tsx` | `{ href: string; name: string; cover: { kind: 'photo'; src: string; alt: string } \| { kind: 'gradient' }; coverTitle: string; coverSub: string; members: User[]; status: string; statusTone: 'go' \| 'muted' }` | `coverTitle` "📍 Goa": the leading emoji is wrapped `aria-hidden` |
| `src/components/home/PastTripRow.tsx` | `{ trip: PastTrip }` | `ListRow dense`, static |
| `src/components/home/IdentityCard.tsx` | `{ user: User; providerLabel: string }` | |
| `src/components/home/SettingsList.tsx` | `{ rows: SettingsRow[] }` where `type SettingsRow = { id: string; emoji: string; title: string; sub: string } & ({ kind: 'link'; href: string } \| { kind: 'action'; onPress: () => void } \| { kind: 'switch'; checked: boolean; onCheckedChange: (v: boolean) => void; label: string })` | `switch` rows are inert apart from the Switch |

**P3-1** owns the pages, `PrototypeControls`, and 2 view files (✚, not yet in PLAN §10's list):

| File | Props | Notes |
|---|---|---|
| `src/app/page.tsx` | — | Welcome. Guard, toasts, composes §1.2 |
| `src/app/home/page.tsx` | — | Guard, `?preset=` (once, via `useSearchParams` in a Suspense boundary), header, picks the view |
| `src/components/home/HomeZeroView.tsx` ✚ | `()` | Reads `users`, `ideas`, `copy` |
| `src/components/home/AppHomeView.tsx` ✚ | `()` | Reads the store. Derives `activeTrips` / `pendingInvites`, calls `declineInvite` |
| `src/app/profile/page.tsx` | — | Guard, TopBar, IdentityCard, SettingsList, Sign out, PrototypeControls |
| `src/components/home/PrototypeControls.tsx` | `()` | Store-connected (`applyPreset`, reset), `useRouter` |

### 1.6 Deviations from the design
1. **Sign-in skips A2/A3.** "Continue with Google" calls the `signInWithGoogle()` stub (400ms) and lands on `/home`. The design links to `P-Google-Account`, which is excluded (§8.1).
2. **Auth guards.** `/` redirects to `/home` when signed in. `/home` and `/profile` redirect to `/` when signed out. The design has no auth state.
3. **The toggle knob moves.** The `Switch` atom translates the knob 20px over 200ms. In the design (A5/A7) only the colour changes, because the `.knob` rule is missing. This follows the PLAN §7.1 `Switch` spec, the P1-3 acceptance criteria and inventory note #4. Semantics are Radix `role="switch"` with `aria-checked`, instead of `button aria-pressed`. The value persists in `session.notifications`.
4. **Decline only toasts.** The card stays and no state changes, as designed (§9.4 `declineInvite`).
5. **Profile counts are literal.** "1 active · 2 past · 1 invite" appears verbatim on both A5 and A7 (§12.1 #3), even though A4 has no trips and A6 shows "2 active".
6. **A5 and A7 are one route.** `/profile`'s Back uses `router.back()` with `/home` as the fallback. `/home` renders A4 or A6 from state, so both of the design's back targets are honoured. The "Your trips" row goes to `/home`: the design always lands on A6, but here a user with no trips sees A4.
7. **Section metas are computed.** "1 new" and "2 active" are counts of `pendingInvites` and `activeTrips`, which equal the design under the seed. After the Bali invite is accepted, the Invites section disappears and Bali joins "Your trips".
8. **Goa is hard-coded as the entry.** Idea cards, Create a trip, Ask Go and the FAB all go to `/trips/new`, which always uses the Goa draft (§12.1 #2). Nothing is pre-filled from the tapped idea.
9. **A6 appears after the first trip.** College gang, the Bali invite and past trips are seeded when the Goa draft is created, or by preset (§12.1 #3).
10. **The Goa card's target depends on stage.** Preset `A6` sets `goa` to `planned`, so the card opens J1 (`P-Home`) as in the design. In the organic flow (stage `new`), it opens I1.
11. **A Prototype controls section** is added under Sign out (§9.6). It is not in the design.
12. **TopBar top padding is 56** (`pt-safe`), not the design's 52.
13. **Reduced motion follows globals.** Animation durations go to near zero: no rise, a static spinner, and the bar sits at 62%. The design instead switches to fades, slows the spinner to 1600ms, and keeps the fill static.
14. **Welcome responsiveness.** The orbit cluster is a fixed 420×504 box, centred and scaled to 0.88 below 880px of frame height and to 0.74 below 780px. The design is a fixed 420×912 artboard.
15. **The Welcome headline is fixed** to the default option. The other 4 options stay in `copy.ts` and cannot be switched at runtime.
16. **The Bali thumbnail** keeps the Gokarna illustration, as in the design (§12.3 has no Bali asset).
17. **Off-token values** are used as arbitrary classes and reported, not added to globals:
    - Welcome gradient stops `#FFFBFA` / `#FFFDFC`;
    - orbit drop-shadow `rgb(164 79 58/0.12)`;
    - glow mid-stop `rgb(251 233 226/0.6)`;
    - ground shadow `rgb(11 27 63/0.18)`;
    - hero-title tracking `-0.022em`;
    - orbit-label tracking `0.01em`;
    - pill rise duration 420ms (`--animate-rise` is 520ms).
18. **The legal links** are inline `<button type="button">` text links inside the sentence, because the Button atom has no inline-text variant.

### 1.7 Acceptance checklist (frame width 420px; reach each state with `/home?preset=<id>`)

**A1 — Welcome**
- [ ] When signed out, `/` shows the dashed ring (300px, #EFDCD5), the peach glow, and 6 orbit items: Manali at the top, then clockwise Kerala, Jaipur, Gokarna (bottom), Udaipur, Ladakh. The mascot is centred over a soft ground shadow. Nothing scrolls.
- [ ] On load, the orbit items rise in sequence (60ms stagger), the mascot rises over 600ms, and the pills at 420/540ms. The green bar grows to 62% starting at 500ms. The 14px spinner turns once every 800ms.
- [ ] Pill 1 is 160px wide at x232/y284 and reads "Comparing 24 stays", with a 4px progress bar. Pill 2 is 38px tall and reads "Cabs sorted for 6", with an 18px green check.
- [ ] The h1 reads "Group trips shouldn’t fall on one friend." (34/600, centred, balanced). The subline is 16px muted and at most 350px wide.
- [ ] Three white 44×44 tiles with card shadow: 🗳️ Quick group polls · 🏡 Stays found & booked · 💸 Splits sorted.
- [ ] "Continue with Google" is a 56px full-width black pill with the multicolour 20px G. Tapping it lands on `/home` (A4) after about 400ms. Reloading `/` while signed in redirects to `/home`.
- [ ] Terms → toast "Opens Go’s terms in your browser". Privacy Policy → toast "Opens Go’s privacy policy in your browser". The toast is a navy pill 108px above the bottom and auto-dismisses after 2.2s.
- [ ] At 390×844 the orbit cluster does not overlap the h1. At 420×912 it is unscaled.

**A4 — Home, first run**
- [ ] The header shows "Welcome to Go" (13/600 muted) over "Your trips" (34/600), with the Aarav avatar (40, in a 44 hit area) on the right and 60px top padding.
- [ ] The hero card has radius 28, a peach→white gradient, a dashed ring at the top right, and the mascot (58×132) at right 34 / top 14. "Start your first group trip" wraps within 230px. The full-width black 56px "Create a trip" with + goes to `/trips/new`.
- [ ] "Ideas for your crew" sits baseline-aligned with "From Bengaluru", 14px of extra space above.
- [ ] The carousel has 6 cards (150 wide, radius 20) with tinted 104px wells (Goa amber-soft, Coorg green, Gokarna info, Jaipur peach, Pondy amber-tint, Hampi peach-2). The first card is inset 16px, cards snap one at a time, and no scrollbar shows. A pressed card scales to 0.985 and turns #F5F6F8. Every card goes to `/trips/new`.
- [ ] The Ask-Go row shows the Go avatar on #DCEBFF, "Not sure where? Ask Go" / "Go suggests places from everyone’s answers" and a chevron, and goes to `/trips/new`.
- [ ] No FAB, no invites or trips sections, no toast.
- [ ] The avatar goes to `/profile` (A5).

**A5 — Profile (first run)**
- [ ] The TopBar has a 44px back arrow and "Profile" (20/700).
- [ ] Identity card (radius 24): avatar 64, "Aarav Shah" 22/600, "aarav.shah@gmail.com" 13 muted, and a green 14px check with "Signed in with Google" in #0F7A37.
- [ ] Settings card (radius 22): 4 rows (🛫 🧳 💳 🔔), 36px grey emoji bubbles, hairline dividers between rows, chevrons on rows 1–3.
- [ ] The notifications switch starts green with the knob on the right. A tap slides the knob 20px left over 200ms and turns the track #DDE1E6. The value survives a reload.
- [ ] Travelling from → toast "Change it from the From chip in any trip chat". Payment methods → toast "Payment methods open here in the real app". Tapping the notifications row text does nothing.
- [ ] The "Your trips" row reads "1 active · 2 past · 1 invite" and goes to `/home`, which renders A4 here. Back also lands on A4.
- [ ] Sign out is a 52px white pill with a 1px #DDE1E6 border and #B42318 16/600 text. It goes to A1, and `/home` then redirects to `/`.
- [ ] "Prototype controls" sits below Sign out and is labelled prototype-only. Reset demo returns to A1, signed out. Jump to artboard → `J4` opens the J4 state.

**A6 — App home**
- [ ] The header reads "Welcome back" / "Your trips", with 56px top padding.
- [ ] "Invites" sits with "1 new". The invite card shows a 52px #E1F0FA thumb with the Gokarna illustration, "Bali crew", "Priya invited you · Christmas, 25–28 Dec", and a 20px Priya + Kabir stack with "Priya and Kabir are in". Accept (black, 44, 15/500) and Decline (#F2F2F2, 15/600) split the row equally.
- [ ] Accept → `/invite/bali-x9m` (G1). Decline → toast "Invite declined. Priya won’t be told.", and the card stays.
- [ ] "Your trips" sits with "2 active". The Goa card has a 128px photo cover with a bottom scrim, "📍 Goa" (24/700), "Fri 6 – Mon 9 Nov · in 34 days", and 4 avatars (26px, −8 overlap) at the bottom right. Its footer shows "Goa crew", a terracotta "2 things pending on you" and a chevron. The card goes to `/trips/goa`.
- [ ] The College gang card has a warm 160° gradient cover with a white dashed ring, "New trip" / "Where and when not decided yet", 2 avatars, and a muted "Go is collecting everyone’s answers". It goes to `/trips/college`.
- [ ] "Past trips" lists "Pondy weekend" / "Aug 2026 · 5 people · all settled" and "Coorg with the college gang" / "Mar 2026 · 7 people · all settled", with 44px tinted thumbs and 22px green check badges. The rows are not tappable.
- [ ] The "New trip" FAB (56px, 17/600, shadow-fab, + icon) is centred 28px above the bottom over a 120px canvas fade, and goes to `/trips/new`. Content scrolls under the fade, and the last row clears the FAB (130px bottom padding).
- [ ] The avatar goes to `/profile` (A7).

**A7 — Profile (from app home)**
- [ ] Pixel-identical to A5, including the same literal counts.
- [ ] Back lands on `/home` = A6. The "Your trips" row also goes to A6.
- [ ] The switch, toasts, Sign out and Prototype controls behave as in A5.

### 1.8 Consumed by tasks
- **P3-16** (batch 3A, sonnet) builds every P3-16 file in §1.5. It also owns `I-plan-empty.md` and `B-crew.md` pieces, which are out of scope here.
- **P3-1** (batch 3B, sonnet) builds the pages, the two views and `PrototypeControls`. It depends on P3-16.

Atoms and composites relied on:
- **P1-1**: `Button` (`primary xl/base`, `secondary base`, `danger-outline lg`, `ghost icon`; `asChild` with `<Link>`).
- **P1-2**: `Avatar` (sizes 20/26/40/64, `kind=go`), `AvatarStack` (20/−6, 26/−8, `max`), `CheckBadge` (14/18/22), `EmojiTile` (36 circle, 44 rounded-2xl).
- **P1-3**: `Switch`.
- **P1-5**: `Card` (`shadow`, `glass`; radii `xl/2xl/3xl/4xl`; export `cardVariants`), `ListCard`/`ListRow` (with className passthrough), `SectionHeader`, `Progress` (+ `animate-fill`), `FadeDock variant=fade`, `TopBar`, `ScreenTitle`.
- **P0-1**: `Screen`, `AppFrame`, `<Toaster>`, `lib/toast.ts` `toastGo`.
- **P0-2**: `Plus`, `ChevronRight`, `ArrowLeft`, `Check`; custom `Spinner`; `public/icons/brand/google.svg`.
- **P0-4**: `assets.goMascot`, `assets.goAvatar`, `avatars/*`, `illustrations/{goa,coorg,gokarna,jaipur,pondy,hampi,manali,kerala,udaipur,ladakh}`, `photos/goa-beach`.
- **P2-1**: `users`, `trips`, `invites`, `ideas`, `pastTrips`, `copy`, `presets` (ids + titles).
- **P2-2**: `session.signIn/signOut/notifications`, the trips slice, `declineInvite`, `applyPreset`, `useHydrated`.
- **P2-3**: `GoogleButton`, `lib/auth.signInWithGoogle`.

Upstream contracts this spec assumes. The owner adds these, or the executor reports them as gaps:
- **P2-1**: §9.1 has no `Idea` or `PastTrip` types and no home-card or invite-card strings. Add:
  - `Idea { id; name; tag; travelEmoji; travel; tintClass; img }`;
  - `PastTrip { id; title; sub; tintClass; img }`;
  - `Trip.homeCard { coverTitle; coverSub; status; statusTone: 'go' | 'muted' }` (the design has one label set per trip, used for every stage);
  - `Invite.cardSub` and `Invite.membersLine`;
  - `presets.ts` entries carrying a `title`;
  - `copy.welcome`, `copy.home`, `copy.profile` and `copy.prototype` groups.
- **P2-2**:
  - `setNotifications(on: boolean)` on the session slice (§9.4 lists only `signIn`/`signOut`);
  - `applyPreset(id): string` returning the target href (route + query);
  - `createDraftGoa()` also seeds `college`, the Bali invite and `pastTrips` (§12.1 #3).
- **P2-3**: `GoogleButton({ onSignedIn }: { onSignedIn: () => void })` awaits `signInWithGoogle()`, then calls `onSignedIn`. Double taps are guarded with `aria-busy`, not `disabled`, because disabled would grey the button.
- **P1-5**: `Progress` must render its bar by width (`style={{ width: `${value}%` }}` + `origin-left`), not by shadcn's `translateX`, so `animate-fill` (scaleX) works.
- **P1-2**: the `AvatarStack` ring must be a 2px white **border** (`box-border`), keeping the outer size at 20/26px as in the design, not an outer `ring-2`.

## 2. Inventory (reference, from the source artboards)

Pasted verbatim from the group A+B inventory. Edits: B-screen sections (B1, B2, B6, B7, G1) and B-only conventions and group notes are removed, and PLAN §7 component names are added in `[brackets]` after the inventory's phrase where a 1:1 match exists. Headings are demoted one level so they nest under this section. Everything else, including copy strings, px and hex, is unchanged.

Source dir: `/Users/ankurshrivastava/Code/go/design/prototype/`. All artboards 420x912. Canvas titles come from `canvas.json`.

### Conventions used below
- **Shell (all except P-Main)**: root `div` is `position: relative; width 420; height 912; display flex; flex-direction column; background #F6F7F9; font-family 'Satoshi','Figtree',system-ui,sans-serif; color #0B1B3F; overflow hidden; -webkit-font-smoothing antialiased`. Figtree 400–800 comes from Google Fonts. Satoshi is listed first but never loaded, so the screens actually render in Figtree.
- **card-shadow** = `0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06)`
- **ink** = #0B1B3F (primary text), **muted** = #4A5878 (secondary text), **chev** = #A5ACB8, **divider** = `1px solid #ECEFF3`, **terracotta** = #A44F3A (Skip / Not now / pending accent), **green** = #16A34A (fill), **green-text** = #0F7A37, **danger** = #B42318
- **Toast**: see Group notes ("toast"). Every screen except Home-Zero has it, with a 2200 ms auto-dismiss.
- Every script carries the same unused chat scaffolding (`pSent`, `_send`, which replies "Got it 👍 I’ll factor that into the plan." after 1200 ms). None of these 10 screens renders it.

---

### P-Main.dc.html — A1 · Welcome (doc title "Go — Welcome (v2)")
#### Purpose (1 line)
Logged-out welcome / value prop with a "Continue with Google" CTA.
#### Layout top→bottom
- Root: 420x912, `box-sizing border-box; padding: 0 24px max(24px, env(safe-area-inset-bottom))`, flex column, `background: linear-gradient(180deg, #FFFBFA 0%, #FFFDFC 30%, #FFFFFF 55%)`, `font-feature-settings 'kern' 1`, overflow hidden. Nothing scrolls.
- **Illustration cluster** (all `position:absolute`, aria-hidden decorations):
  - Dashed orbit ring: left 60, top 150, 300x300, `border: 1.5px dashed #EFDCD5`, radius 50%.
  - Glow disc: left 98, top 188, 224x224, `radial-gradient(closest-side, #FBE9E2 0%, rgba(251,233,226,0.6) 55%, rgba(251,233,226,0) 100%)`.
  - 6 destination "orbit" items, `class="orbit"` with `--i` 0..5 (staggered 60 ms each). Each is 80 wide, a centred column holding an img 68x68 with `filter: drop-shadow(0 6px 8px rgba(164,79,58,0.12))` and a label 12px/600 muted, letter-spacing 0.01em, line-height 1.3, margin-top 2:
    - i0 Manali (left 170, top 116); i1 Kerala (300, 191); i2 Jaipur (300, 341); i3 Gokarna (170, 416); i4 Udaipur (40, 341); i5 Ladakh (40, 191).
  - Ground shadow under the mascot: left 165, top 384, 90x12, radius 50%, `radial-gradient(closest-side, rgba(11,27,63,0.18), rgba(11,27,63,0))`.
  - Go mascot img, `class="go"`: left 170, top 208, 80x182.
  - **Status pill 1** [`Card variant=glass`] (`class="pill"`, animation-delay 420ms): left 232, top 284, width 160, padding 10px 12px, column gap 8, radius 16, `background rgba(255,255,255,0.86)`, `backdrop-filter blur(10px)`, `border 1px solid #FFFFFF`, `box-shadow 0 1px 2px rgba(11,27,63,0.06), 0 10px 28px rgba(11,27,63,0.12)`.
    - Row (gap 8, 13px/600, nowrap, ls 0.002em, lh 1.35): spinner `class="spin"` [`Spinner`] 14x14 with `border: 2px solid #D7F2E0` and top/right borders #16A34A, then the text "Comparing 24 stays".
    - Progress track [`Progress`]: height 4, radius 999, #E3F5EA, overflow hidden. Fill `class="fill"` is width 62%, height 4, #16A34A.
  - **Status pill 2** [`Card variant=glass`] (`.pill`, delay 540ms): left 26, top 300, height 38, padding `0 14px 0 10px`, radius 999, same glass treatment, 13px/600. It holds an 18px green (#16A34A) circle with a white check (11px, sw 3.5) [`CheckBadge size=18`] and the text "Cabs sorted for 6".
- **Copy block** (`margin-top: auto`, so it sits at the bottom; centred column, gap 10, text-align center):
  - h1 `{{headline}}`: 34px / lh 1.15 / 600 / ls -0.025em / ink / `text-wrap: balance`.
  - p `{{subline}}`: 16px / lh 1.45 / muted / ls -0.011em / max-width 350 / `text-wrap: pretty`.
- **Feature trio** (margin-top 22, flex gap 8, three `flex:1` columns, gap 6, centred). Each has a tile [`EmojiTile size=44`] 44x44, radius 14, bg #FFFFFF, card-shadow, emoji 20px, then a label 13px/600 muted, lh 1.3.
  - 🗳️ "Quick group polls" · 🏡 "Stays found & booked" · 💸 "Splits sorted"
- **CTA block** (margin-top 22, column gap 10):
  - "Continue with Google" `<a>` (primary black pill [`GoogleButton` / `Button variant=primary size=xl`]): height 56, radius 999, bg #000000, #FFFFFF text 18px/500, ls -0.014em, lh 1.3, gap 10. Leading Google "G" img 20x20.
  - Legal line: margin-top 2, centred, 13px muted, lh 1.4, reading "By continuing you agree to our **Terms** and **Privacy Policy**". The two links are `role=button`, ink, 600, default underline.
- Toast (standard) [sonner `Toaster` + `toastGo`].
#### Sheets / overlays
- Toast only, at bottom 108, z 60.
#### State & interactions (from the DCLogic script)
- Props (editable): `headline` is an enum, default "Group trips shouldn’t fall on one friend.". Other options: "Why is it always one friend planning the trip?", "Group trips are fun. Planning them alone isn’t.", "Everyone’s coming. Someone’s stuck planning.", "One friend shouldn’t have to plan the whole trip.". `subline` is text, default "Go reads your group chat and sorts the stays, rides, food and money, so everyone just enjoys the trip."
- State: `pT:null` (toast text), plus unused `pShare:false` and `pSent:[]`.
- `pa_0` (Terms) shows the toast "Opens Go’s terms in your browser".
- `pa_1` (Privacy) shows the toast "Opens Go’s privacy policy in your browser".
- Motion: `@keyframes rise` goes from `opacity 0; translateY(8px) scale(0.96)`.
  - `.orbit` 520ms ease-out, delay `--i*60ms`; `.go` 600ms; `.pill` 420ms (+ inline delays 420/540ms).
  - `.spin` 800ms linear infinite.
  - `.fill` animates scaleX from 0.15 to 1 over 1400ms, delay 500ms, transform-origin left.
  - Reduced motion: these become a fade, spin slows to 1600ms, and fill does not animate.
#### Navigation
| element | target |
|---|---|
| Continue with Google | `P-Google-Account.dc.html` |
| Terms / Privacy Policy | toast only |
#### Data shown (seed values)
- Orbit destinations: Manali, Kerala, Jaipur, Gokarna, Udaipur, Ladakh.
- Pills: "Comparing 24 stays" (progress 62%), "Cabs sorted for 6".
- Features: Quick group polls / Stays found & booked / Splits sorted.
#### Icons & images
- SVG check `M5 12l5 5 9-10`: 11px, stroke 3.5, white on a #16A34A circle.
- Emoji: 🗳️ 🏡 💸 in the feature tiles.
- img (alt / size):
  - `91c74fd5…` "Manali snowy cottage" 68
  - `6b944485…` "Kerala houseboat" 68
  - `71c060d1…` "Jaipur pink palace" 68
  - `4ff20859…` "Gokarna beach hut" 68
  - `a6364f26…` "Udaipur lake palace" 68
  - `ddcb8fab…` "Ladakh monastery" 68
  - `f6048aa7…` "Go, a waving traveller holding a map" 80x182
  - `7ccece32…` Google G logo, alt "", 20x20

---

### P-Home-Zero.dc.html — A4 · Home, first sign-up · ideas carousel (doc title "Go — Home, first trip")
#### Purpose (1 line)
First-run home with no trips: a "Start your first group trip" hero plus a destination ideas carousel.
#### Layout top→bottom
- **Header** (flex-shrink 0, padding `60px 20px 0`, space-between, gap 12):
  - Left column [`ScreenTitle`], gap 2: eyebrow "Welcome to Go" (13px/600 muted, ls 0.002em, lh 1.35), then title "Your trips" (34px/600, ls -0.025em, lh 1.12).
  - Right: profile avatar link with a 44x44 hit area (radius 999) and a 40x40 round img (Aarav) [`Avatar size=40`].
- **Scroll region**: `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none`. Inner padding `16px 16px 40px`, column gap 10.
  - **Hero card** [`HeroCard`]: relative, padding `22px 20px 20px`, radius 28, `background: linear-gradient(180deg, #FFF6F2 0%, #FFFFFF 70%)`, card-shadow, column gap 14, overflow hidden.
    - Decorations (absolute): dashed ring right -40 / top -30, 210x210, `1.5px dashed #EFDCD5`; glow right -6 / top 4, 140x140, `radial-gradient(closest-side, #FBE9E2 0%, rgba(251,233,226,0) 100%)`; Go mascot img right 34 / top 14, 58x132.
    - Title "Start your first group trip": 26px/600, ls -0.022em, lh 1.15, max-width 230, balance.
    - Body "Pick a place, add your crew. Go chases dates, budget and bookings.": 15px muted, ls -0.008em, lh 1.4, max-width 240.
    - CTA wrapper (column gap 8, margin-top 4) holds the primary black pill [`Button variant=primary size=xl`] "Create a trip": height 56, padding 0 18, radius 999, #000, white 18px/500, ls -0.014em, gap 8, with a leading plus icon 20.
  - **Section header** [`SectionHeader`] (margin-top 14, baseline, space-between, padding 0 4): "Ideas for your crew" (20px/600, ls -0.018em, lh 1.3), right label "From Bengaluru" (13px/600 muted).
  - **Ideas carousel** [`IdeasCarousel`]: `margin: 0 -16px; padding: 2px 0 8px; display flex; gap 10; overflow-x auto; scrollbar hidden; scroll-snap-type x mandatory; scroll-padding-inline 16px`. It starts and ends with a 6px spacer (6 + 10 gap gives a 16 inset).
    - Card [`IdeaCard`] `<a class="row">`: width 150, flex-shrink 0, snap start, radius 20, bg #FFF, card-shadow, overflow hidden, column.
    - Image well: height 104, centred, coloured background tint, img 76x76.
    - Body: padding `10px 12px 12px`, gap 2. Name 16px/600 (ls -0.011em, lh 1.3), tag 13px muted, travel line 13px muted.
  - **Ask-Go row** [`AskGoRow`] `<a>` (no `.row`): padding 12px 14px, gap 12, radius 22, bg #FFF, card-shadow.
    - Go avatar img 40 round on bg #DCEBFF [`Avatar size=40 kind=go`].
    - Text "Not sure where? Ask Go" (16px/600) over "Go suggests places from everyone’s answers" (13px muted).
    - Trailing chevron-right.
#### Sheets / overlays
- None. There is no toast markup on this screen.
#### State & interactions (from the DCLogic script)
- `renderVals(){return {}}`. No state at all.
- Interactions are all plain links. `.row` cards scale to 0.985 and turn #F5F6F8 on press; the black CTA gets the white inset overlay.
#### Navigation
| element | target |
|---|---|
| header avatar | `P-Profile-New.dc.html` |
| Create a trip | `P-Who-Zero.dc.html` |
| each of the 6 idea cards | `P-Who-Zero.dc.html` |
| Not sure where? Ask Go | `P-Who-Zero.dc.html` |
#### Data shown (seed values)
- Origin city: Bengaluru.
- Ideas (name / tag / travel / tile bg / blob):
  - Goa / Beaches / ✈️ 1h flight / #FFF1DC / `63e0220f`
  - Coorg / Coffee hills / 🚗 6h drive / #E4F4E4 / `263733bd`
  - Gokarna / Quiet beaches / 🚗 8h drive / #E1F0FA / `4ff20859`
  - Jaipur / Palaces / ✈️ 2.5h flight / #FCE7E4 / `71c060d1`
  - Pondy / French town / 🚗 6h drive / #FFF4D9 / `62855067`
  - Hampi / Ruins / 🚆 9h train / #FBE8DC / `b5284f60`
#### Icons & images
- SVGs:
  - plus `M12 5v14 M5 12h14`: 20, stroke 2, white.
  - chevron-right `M9 6l6 6-6 6`: 16, stroke 2.4, #A5ACB8.
- Emoji: ✈️ 🚗 🚆 in the travel lines.
- img:
  - `c58d972a` Aarav avatar 40
  - `f6048aa7` "Go, a waving traveller holding a map" 58x132
  - destination illustrations 76 (blobs listed above)
  - `5bda4ac2` Go avatar 40, on #DCEBFF, alt ""

---

### P-Profile-New.dc.html — A5 · Profile · first sign-up · new (doc title "Go — Profile")
#### Purpose (1 line)
Profile/settings, reached from first-run home. Byte-identical to A7 except for the back target.
#### Layout top→bottom
- **Top bar** [`TopBar`] (flex-shrink 0, padding `52px 12px 8px`, gap 6):
  - Back arrow link: 44x44, radius 999, ink, arrow-left 22.
  - Title "Profile": 20px/700, ls -0.018em.
- **Scroll region**: `flex:1; overflow-y:auto`, padding `8px 16px 40px`, column gap 12.
  - **Identity card** [`IdentityCard`]: padding 20, radius 24, bg #FFF, card-shadow, gap 14, align center.
    - Avatar img 64 round [`Avatar size=64`].
    - Name "Aarav Shah": 22px/600, ls -0.02em.
    - Email "aarav.shah@gmail.com": 13px muted.
    - Badge row (gap 5, 12px/600, #0F7A37): a 14px #16A34A circle with a white check (8px, sw 4) [`CheckBadge size=14`], then "Signed in with Google".
  - **Settings list card** [`SettingsList` / `ListCard`]: padding `0 14px`, radius 22, bg #FFF, card-shadow.
    - Each row [`ListRow`]: padding 13px 0, gap 12; rows after the first get border-top 1px #ECEFF3.
    - Row parts: a 36px round icon bubble (bg #F4F5F7, emoji 16px) [`EmojiTile size=36`], then a title (15px/600) over a subtitle (13px muted, ls 0.002em, lh 1.35), then a trailing chevron.
    1. `<a role=button class="row">` 🛫 "Travelling from" / "Bengaluru · used for your tickets"
    2. `<a class="row">` 🧳 "Your trips" / "1 active · 2 past · 1 invite"
    3. `<a role=button class="row">` 💳 "Payment methods" / "UPI · HDFC card ••4821"
    4. Plain `<div>` (not tappable) 🔔 "Trip notifications" / "Polls, bookings, Go’s calls", with a **toggle** [`Switch`] in place of the chevron:
       - `button aria-pressed`, 52x32, padding 4, border 0, radius 999, flex align-center.
       - bg #16A34A when on, #DDE1E6 when off.
       - Knob `span.knob`: 24x24 white, radius 999, shadow `0 1px 3px rgba(0,0,0,0.2)`.
  - **Sign out** [`Button variant=danger-outline size=lg`] `<a>`: height 52, radius 999, bg #FFF, `border 1px solid #DDE1E6`, color #B42318, 16px/600.
- Toast (standard) [sonner `Toaster` + `toastGo`].
#### Sheets / overlays
- Toast only.
#### State & interactions (from the DCLogic script)
- `notif: true` initially. `flipNotif` toggles it. `notifStyle` swaps the bg between #16A34A and #DDE1E6. `aria-pressed` is 'true'/'false'.
- `pa_0` (Travelling from) shows the toast "Change it from the From chip in any trip chat".
- `pa_1` (Payment methods) shows the toast "Payment methods open here in the real app".
- **Gap:** this file's CSS has no `.knob` rule (no `translateX(20px)` for `aria-pressed=true`), so in the source only the colour changes and the knob never moves. P-Main's CSS does contain the rule: `.knob{transition:transform 200ms var(--ease-out)} button[aria-pressed="true"]>.knob{transform:translateX(20px)}`.
#### Navigation
| element | target |
|---|---|
| Back | `P-Home-Zero.dc.html` |
| Your trips row | `P-App-Home.dc.html` |
| Sign out | `P-Main.dc.html` |
| Travelling from / Payment methods | toast |
#### Data shown (seed values)
- Aarav Shah, aarav.shah@gmail.com, signed in with Google.
- From: Bengaluru.
- Trips summary "1 active · 2 past · 1 invite".
- Payment: UPI + HDFC card ••4821.
- Notifications on.
#### Icons & images
- arrow-left `M19 12H5 M11 6l-6 6 6 6`: 22, stroke 2, ink.
- chevron-right: 16, sw 2.4, #A5ACB8.
- check: 8, sw 4, white.
- Emoji: 🛫 🧳 💳 🔔.
- img `c58d972a` (Aarav): 64.

---

### P-App-Home.dc.html — A6 · App home · your trips + invites (doc title "Go — Your trips")
#### Purpose (1 line)
Returning-user home: a pending invite, active trips, past trips, and a floating "New trip" FAB.
#### Layout top→bottom
- **Header** (padding `56px 20px 8px`, space-between, gap 12):
  - Eyebrow "Welcome back" (13px/600 muted) over title "Your trips" (34px/600, ls -0.025em, lh 1.12).
  - Avatar link 44 holding a 40 img; goes to Profile.
- **Scroll region** (`flex:1; overflow-y:auto`): inner padding `10px 16px 130px`, column gap 10.
  - **Section header** [`SectionHeader`]: "Invites" (20px/600) with right label "1 new" (13px/600 muted). margin-top 0, padding 0 4, baseline.
  - **Invite card** [`InviteCard`]: padding 14, radius 22, bg #FFF, card-shadow, column gap 12.
    - Top row (gap 12):
      - Thumb 52x52, radius 14, bg #E1F0FA, holding img 44 (the Gokarna-hut illustration standing in for Bali).
      - Text column (gap 2): "Bali crew" (16px/600) / "Priya invited you · Christmas, 25–28 Dec" (13px muted).
      - Avatar-stack line (gap 6, 13px muted) [`AvatarStack size=20 overlap=-6`]: 20px avatars, `border 2px solid #FFF`, margin-left -6 with padding-left 6 [Priya, Kabir], then "Priya and Kabir are in".
    - Button row (gap 8):
      - "Accept" [`Button variant=primary size=base`] `<a>`: height 44, padding 0 18, radius 999, #000, white 15px/500, ls -0.014em, flex 1.
      - "Decline" [`Button variant=secondary size=base`] `<a role=button>`: height 44, padding 0 14, radius 999, bg #F2F2F2, ink 15px/600, ls -0.004em, flex 1.
  - **Section header** [`SectionHeader`] (margin-top 14): "Your trips" with right label "2 active".
  - **Trip card A** [`TripCard`] (`<a class="row">`): radius 24, bg #FFF, card-shadow, overflow hidden, column.
    - Cover: height 128, relative.
      - Photo img (cover) with scrim `linear-gradient(180deg, rgba(11,27,63,0) 30%, rgba(11,27,63,0.6) 100%)`.
      - Bottom-left at 14/12, white: "📍 Goa" (24px/700, ls -0.02em, lh 1.1) over "Fri 6 – Mon 9 Nov · in 34 days" (14px/500).
      - Bottom-right at 12/12: avatar stack [`AvatarStack size=26 overlap=-8`] of 26px avatars, `border 2px #FFF`, overlap -8 (4 avatars).
    - Footer (padding 12px 14px, gap 10): "Goa crew" (16px/600) over "2 things pending on you" (13px/600 #A44F3A), then a chevron.
  - **Trip card B** [`TripCard`] (`<a class="row">`, same shell):
    - Cover is not a photo: `linear-gradient(160deg, #F4C9A8 0%, #D98A68 45%, #8E4A3A 100%)`, plus a dashed ring (right -40, top -30, 170x170, `1.5px dashed rgba(255,255,255,0.45)`) and the same scrim.
    - Cover text: "New trip" (24px/700) over "Where and when not decided yet" (14px/500).
    - Avatars (2).
    - Footer: "College gang" over "Go is collecting everyone’s answers" (13px muted, regular weight), then a chevron.
  - **Section header** [`SectionHeader`] (margin-top 14): "Past trips" (no right label).
  - **Past list card** [`ListCard` + `PastTripRow`]: padding `2px 14px`, radius 22, bg #FFF, card-shadow. Rows are non-tappable `div`s: padding 10px 0, gap 12, divider between rows.
    - Row parts: thumb 44x44 (radius 12, tinted bg, img 36), title 15px/600, subtitle 13px muted, then a trailing green check badge [`CheckBadge size=22`] (22px #16A34A circle, white check 12px, sw 4).
- **Bottom fade** [`FadeDock variant=fade`]: absolute bottom 0, height 120, pointer-events none, `linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 70%)`.
- **FAB "New trip"** [`Button variant=primary size=xl`] `<a>`: absolute left 50% / bottom 28 / translateX(-50%), height 56, padding 0 24, gap 8, radius 999, #000, white 17px/**600**, nowrap, `box-shadow 0 8px 24px rgba(11,27,63,0.25)`, plus icon 20.
- Toast (standard) [sonner `Toaster` + `toastGo`].
#### Sheets / overlays
- Toast only.
#### State & interactions (from the DCLogic script)
- `pa_0` (Decline) shows the toast "Invite declined. Priya won’t be told.". The card is **not** removed; there is no state for it.
- Everything else is a link.
#### Navigation
| element | target |
|---|---|
| header avatar | `P-Profile.dc.html` |
| Accept (Bali invite) | `P-Trip-Invite-Bali.dc.html` |
| Decline | toast |
| Goa crew card | `P-Home.dc.html` |
| College gang card | `P-TripHome-Zero.dc.html` |
| FAB New trip | `P-Who-Zero.dc.html` |
#### Data shown (seed values)
- **Invite:** Bali crew. Inviter Priya. "Christmas, 25–28 Dec". Members in: Priya and Kabir. Thumb tint #E1F0FA with blob `4ff20859`.
- **Active trip 1:** "Goa crew", destination Goa, "Fri 6 – Mon 9 Nov · in 34 days".
  - Avatars: Aarav `c58d`, Rahul `cb0a`, Priya `234f`, 4th `8c7b` (unnamed).
  - Status "2 things pending on you".
  - Photo `5bfbb197` "Goa beach".
- **Active trip 2:** "College gang". Destination undecided ("New trip / Where and when not decided yet"). Avatars Aarav and Rahul. Status "Go is collecting everyone’s answers".
- **Past trips:**
  - "Pondy weekend" / "Aug 2026 · 5 people · all settled" (#FFF4D9, `62855067`)
  - "Coorg with the college gang" / "Mar 2026 · 7 people · all settled" (#E4F4E4, `263733bd`)
#### Icons & images
- SVGs: chevron-right (16, 2.4, #A5ACB8); check (12, sw 4, white); plus (20, sw 2, white).
- Emoji: 📍 in the cover title.
- img:
  - `5bfbb197` "Goa beach": cover 100% x 128
  - avatars: 20 (invite), 26 (cover)
  - `69bfc542`: invite avatar 2, inferred to be Kabir
  - illustrations: 44 (invite), 36 (past)

---

### P-Profile.dc.html — A7 · Profile · from app home · new (doc title "Go — Profile")
#### Purpose (1 line)
Same Profile screen as A5, reached from App home.
#### Layout top→bottom
- Identical to P-Profile-New (see above). The `diff` shows exactly one changed line: the Back link's href.
#### Sheets / overlays
- Toast only (same texts as A5).
#### State & interactions (from the DCLogic script)
- Identical to A5: `notif:true`, `flipNotif`, `pa_0` and `pa_1` toasts.
#### Navigation
| element | target |
|---|---|
| Back | `P-App-Home.dc.html` |
| Your trips row | `P-App-Home.dc.html` |
| Sign out | `P-Main.dc.html` |
#### Data shown (seed values)
- Same as A5.
#### Icons & images
- Same as A5.

---

### Group notes

#### Shared elements (same markup repeated)
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
- **Toast** [sonner `Toaster` + `toastGo`]: `<sc-if pToast>`. `div.enter role=status`.
  - Position: absolute, left 50%, translateX(-50%), **bottom 108**, z 60.
  - Box: max-width 340, padding 12px 16px, radius 16, bg #0B1B3F.
  - Text: white 14px/600, lh 1.35, centred.
  - Shadow: `0 10px 30px rgba(11,27,63,0.3)`.
  - Behaviour: `_toast(t)` sets the text and auto-clears after **2200 ms**; a new toast resets the timer.
- **Primary black pill button** [`Button variant=primary`]: radius 999, bg #000000, #FFFFFF, `letter-spacing -0.014em`. Sizes in use:
  - **56 / 18px / 500**: Welcome, Create a trip, Next, Accept & join.
  - 52 / 16px / 500: Share in WhatsApp group.
  - 44 / 15px / 500: invite Accept.
  - FAB: 56 / **17px / 600**, with shadow `0 8px 24px rgba(11,27,63,0.25)`.
- **Secondary grey pill** [`Button variant=secondary`]: height 44, bg #F2F2F2, ink 15px/600 (Decline).
- **Outline pill** [`Button variant=danger-outline`]: height 52, white, `1px #DDE1E6` border, #B42318 text (Sign out).
- **Back arrow button** [`Button variant=ghost size=icon`; glass variant: `GlassIconButton`]:
  - Default: 44x44 round, arrow-left 22 sw 2, ink.
  - Glass variant on photos: 40x40, `rgba(11,27,63,0.35)` + blur 12, white icon.
- **Screen title stack** [`ScreenTitle`] ("eyebrow + 34px title"): eyebrow 13px/600 muted; title 34px/600, ls -0.025em, lh 1.12.
- **Section header row** [`SectionHeader`]: 20px/600, ls -0.018em, lh 1.3, with an optional right meta (13px/600 muted). padding 0 4, `align-items baseline`, typically margin-top 14 (24 on B6).
- **Card** [`Card variant=shadow`]: bg #FFF, card-shadow. Radius by role: 22 (lists/rows), 24 (trip cards, identity), 28 (hero/invite cards), 20 (idea cards).
- **Settings/list row** [`ListRow`]: padding 13px 0 (settings) or 10px 0 (lists), gap 12, divider `1px #ECEFF3` between rows. Title 15–16px/600, subtitle 13px muted with ls 0.002em and lh 1.35, trailing chevron 16 #A5ACB8 sw 2.4.
- **Emoji icon bubble** [`EmojiTile`]: 36 round, #F4F5F7, emoji 16 (Profile). Variant: 40 round white, emoji 18 (B1).
- **Avatar stack** [`AvatarStack`]: round imgs with `border 2px solid #FFF`, negative margin-left, and a matching padding-left on the wrapper. Sizes/overlaps: 20 / -6, 22 / -7, 26 / -8, 28 / -8. The B1/B6 cluster uses 52 / -14 with a 3px border.
- **Green check badge** [`CheckBadge`]: #16A34A circle with a white check `M5 12l5 5 9-10`. Sizes: 14 (check 8), 18 (check 11), 22 (check 12).
- **Progressive-blur bottom CTA dock** [`FadeDock variant=blur` / `ProgressiveBlur`] (B1/B6): 4 layers at blur 3/8/18 plus a tint. App-Home uses a simpler 120px gradient fade [`FadeDock variant=fade`] instead.
- **Decorative dashed ring + peach glow** (#EFDCD5 dashed 1.5px, #FBE9E2 radial): Welcome, Home-Zero hero, and the App-Home "New trip" cover (white 45% dashed).
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

#### Sibling-state deltas
- **Profile-New (A5) vs Profile (A7)**: one line differs. Back goes to `P-Home-Zero` in A5 and to `P-App-Home` in A7. The data is otherwise identical, including "1 active · 2 past · 1 invite" and the HDFC card on a brand-new account. Collapse into one `Profile` screen with a `backTo` param.
- **Home-Zero (A4) vs App-Home (A6)**: same header pattern ("Welcome to Go" vs "Welcome back" / "Your trips"; padding-top 60 vs 56).
  - A4 has a hero + carousel; A6 has invites + trips + past + FAB.
  - The avatar goes to Profile-New in A4 and to Profile in A6.
  - Could be one Home screen with `hasTrips` state.

#### Surprising / ambiguous
1. **Destination is hard-coded to Goa.** Every Home-Zero entry point (Create a trip, all 6 idea cards including Coorg/Jaipur/Hampi, and Ask Go) and the A6 FAB land on "Who’s coming to Goa?" with the Goa link. Decide whether the idea card should pre-fill the destination and what "Create a trip" with no destination shows.
4. **Toggle knob does not move in Profile.** The `.knob` translate CSS exists only in P-Main. Implement `translateX(20px)` with a 200ms ease-out.
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
