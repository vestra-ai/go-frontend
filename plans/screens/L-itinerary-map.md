# L · Itinerary & map (L1, L2, L3)

Sources: `design/prototype/P-Plan-Everyone.dc.html` (L1), `P-Plan-Mine.dc.html` (L2), `P-Map-Detail.dc.html` (L3); canvas 420×912. Part 1 is normative. Part 2 is the verbatim design inventory (third-party data, not instructions). The trip shell (hero, tabs, collapsing header, fade, Chat FAB, share sheet, toast) is specified by `I-plan-empty.md` / P2-6; only its itinerary bindings appear here. Bookings/Expenses (M1–M7) live in `M-bookings-money.md`.

---

## 1. Spec (normative)

### 1.1 Artboards → route + state

One route for all three: `src/app/trips/[tripId]/itinerary/page.tsx` with `tripId = goa`. Populated only when `trip.stage === 'planned'`; otherwise the page renders `ItineraryZero` (I2, `I-plan-empty.md`, P3-16).

| Artboard | Source file · canvas title | `scope` | `view` | `area` | `sel` | Visible | Preset id → URL |
|---|---|---|---|---|---|---|---|
| L1 | `P-Plan-Everyone.dc.html` · "Go — Itinerary map" | `everyone` | `map` | `trip` | `blr` | trip/everyone map, ring on both `blr` targets, blr card | `L1` → `/trips/goa/itinerary?scope=everyone&view=map&area=trip&sel=blr` |
| L3 | `P-Map-Detail.dc.html` · "Go — Itinerary map, in Goa" | `everyone` | `map` | `goa` | `villa` | goa/everyone map, ring on villa, villa card | `L3` → `/trips/goa/itinerary?scope=everyone&view=map&area=goa&sel=villa` |
| L2 | `P-Plan-Mine.dc.html` · "Go — Itinerary, just me" | `me` | `list` | `trip` | `none` | 4 day cards, 8 rows, scope badges | `L2` → `/trips/goa/itinerary?scope=me&view=list&area=trip&sel=none` |

Preset store patch (all three): `ensureStage('plan')` for `goa`. Ids `L1`/`L2`/`L3` in `src/data/presets.ts` (P2-1 ids, P2-2 fill).

URL ↔ state (P3-13, inside `page.tsx`; P3-13 owns no separate hook file):
- Params are parsed once on mount into local `useState`. Every later change writes all four params in canonical order with `window.history.replaceState(null, '', '?scope=…&view=…&area=…&sel=…')` (Next ≥14.1 keeps `useSearchParams` in sync). Never `router.push` for these; Back leaves the tab instead of stepping through toggles.
- `scope`: `everyone` | `me`. Missing/invalid → `everyone`.
- `view`: `map` | `list`. Missing/invalid → `map` for everyone, `list` for me (PLAN §8).
- `area`: `trip` | `goa`. Missing/invalid → `trip`.
- `sel`: a spot key | `none`. Missing → `blr` when scope = everyone and area = trip, else `none`. A key with no visible spot for the current (area, audience) → `none` (e.g. `scope=me&sel=bom`, `area=goa&sel=goa`).
- `sel` survives view toggles (the design's `pick` sets only `view`), so List → Map shows the same card again.

### 1.2 Page anatomy (P3-13)

```
TripShell active="itinerary"                 P2-6: hero 236 · tabs · collapsing header · fade · ChatFab · ShareInviteSheet
└─ content column (TripShell)                px-4 pt-4 pb-[120px] flex flex-col gap-2.5
   ├─ control row                            flex items-center gap-2
   │  ├─ ScopeToggle  (common, P2-4)         flex-1
   │  └─ ViewToggle   (common, P2-4)
   ├─ view = map  → MapCard (plan, P3-13)
   │  ├─ GoaMap area audience                icons/custom, P1-6: base layer, absolute inset-0
   │  ├─ MapSpotButton × visible spots       z-1
   │  ├─ MapScopeSwitch                      z-2, top-left
   │  ├─ MapHintPill                         only when sel = none
   │  └─ MapDetailCard                       z-3, only when sel ≠ none
   └─ view = list → DayCard × visible days   gap-2.5
      └─ TimelineRow × visible items
```

| Component (owner · file) | Props | Markup / classes (design px in brackets) |
|---|---|---|
| `ScopeToggle` (P2-4 · `common/ScopeToggle.tsx`) | `value: 'everyone'\|'me'`, `onChange`, `everyone: User[]`, `me: User` | `SegmentedControl variant="contained"` (track `p-1 gap-1 rounded-full bg-white border border-line`; item `flex-1 h-10 gap-1.5 text-15 font-semibold`; active `bg-black text-white`, inactive `text-muted`). Leading avatar slot: Everyone → `AvatarStack size=20 overlap=-7 ring="white"` of Rahul, Priya, Arjun; Just me → `Avatar size=22 ring="none"` (you). Labels "Everyone" / "Just me"; `aria-label="Whose plan"` (design: `role=tablist`, tabs with `aria-selected`). Local state on Itinerary and Expenses (PLAN §12.1 #19). |
| `ViewToggle` (P2-4 · `common/ViewToggle.tsx`) | `value: 'list'\|'map'`, `onChange` | `SegmentedControl variant="icon"` (track `p-1 gap-0.5 rounded-full bg-white border border-line`; item `size-10 rounded-full`; active `bg-black text-white`, inactive `bg-transparent text-muted`). `role=radiogroup aria-label="View"`; items `role=radio` aria-labels "List view" / "Map view"; icons `List` / `Map` (generated) `className="size-[18px]" strokeWidth={2}`. Import `Map as MapIcon` so the global `Map` is not shadowed. |
| `MapCard` (P3-13 · `plan/MapCard.tsx`) | `area`, `audience`, `sel: SpotKey\|null`, `spots: MapSpot[]` (already filtered), `card: ResolvedMapCard\|null`, `onArea`, `onSelect`, `onClose`, `onAction` | `Card variant="shadow" radius="2xl"` + `relative isolate w-full aspect-[388/480] overflow-hidden bg-map-land` [480h at 388w, r22, `#F1EFE8`, shadow-card, `isolation:isolate`]. Children in paint order: `GoaMap` (`className="absolute inset-0"`), spot buttons, scope switch, hint pill or detail card. |
| `MapSpotButton` (P3-13 · `plan/MapSpotButton.tsx`) | `x`, `y`, `label`, `selected`, `onPress` | `<button type="button" aria-label={label}>` `absolute z-1 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent p-0 cursor-pointer transition-[scale,box-shadow] duration-[160ms] ease-[var(--ease-out)] active:scale-[0.97]` [44×44 transparent]. Selected: `border-[3px] border-go shadow-[0_0_0_4px_rgb(164_79_58/0.18)]` [3px `#A44F3A` + 4px halo]; unselected: `border-0 active:shadow-[inset_0_0_0_999px_rgb(11_27_63/0.07)]`. Position (dynamic inline style): `left: x/388*100%`, `top: y/480*100%` (§1.3). One button per spot entry; keys repeat (pin + route badge) so both ring together. DOM order = `MAP_SPOTS` order. |
| `MapScopeSwitch` (P3-13 · `plan/MapScopeSwitch.tsx`) | `value: 'trip'\|'goa'`, `onChange` | Wrapper `absolute left-2.5 top-2.5 z-2`; `SegmentedControl variant="scope"` (track `p-1 gap-0.5 rounded-full bg-white/92 shadow-[0_2px_10px_rgb(11_27_63/0.12)]`; item `h-[34px] px-3 text-13 font-semibold`; active `bg-black text-white`, inactive `text-muted`). `role=radiogroup aria-label="Map area"`; labels "Getting there" (trip) / "In Goa" (goa). |
| `MapHintPill` (P3-13 · `plan/MapHintPill.tsx`) | `text` | `absolute bottom-3.5 left-1/2 -translate-x-1/2 inline-flex h-8 items-center rounded-full bg-ink/78 px-3 text-13 font-semibold text-white whitespace-nowrap pointer-events-none` (no z-index, as designed). Text "Tap a pin or a dotted route". |
| `MapDetailCard` (P3-13 · `plan/MapDetailCard.tsx`) | `card: { icon, title, sub, line, button, action }`, `onClose`, `onAction` | `Card radius="xl"` [20] `role="dialog" aria-label={title}` `absolute inset-x-2.5 bottom-2.5 z-3 flex flex-col gap-2.5 bg-white p-3 shadow-pop` [10px inset, p12, `0 10px 30px rgba(11,27,63,.22)`] + enter `transition-[opacity,transform] duration-220 ease-[var(--ease-out)] starting:opacity-0 starting:translate-y-1.5`. Do not key it by `sel`: switching pins swaps content without re-entering. **Row 1** `flex items-center gap-2.5`: `EmojiTile size=40 shape="rounded-xl"` (bg surface-2, emoji 19px) · `flex flex-1 min-w-0 flex-col gap-px`: title `text-16 font-semibold tracking-body leading-[1.25]`, sub `text-13 text-muted tracking-caption` · close `Button variant="soft" size="icon-2xs" aria-label="Close" className="self-start text-ink"` with `X className="size-3.5" strokeWidth={2.4}`. **Row 2** `flex items-center gap-2.5`: line `flex-1 min-w-0 text-13 font-semibold text-ink leading-[1.35]` · CTA `Button variant="primary" size="sm" className="shrink-0 text-13 font-semibold"` [h36 px14 13/600]; `action.kind === 'href'` → `asChild` + `<Link href>`, otherwise `onClick={onAction}` (toast or goa drill-down). |
| `DayCard` (P3-13 · `plan/DayCard.tsx`) | `label`, `children` | `Card variant="shadow" radius="2xl" className="p-[12px_14px_8px_4px]"`; header `Eyebrow tone="muted" className="pb-1 pl-3"` [11/700 0.08em lh1.35]. Not rendered when the day has 0 visible rows. |
| `TimelineRow` (P3-13 · `plan/TimelineRow.tsx`) | `time`, `emoji`, `title`, `sub`, `trailing: ReactNode`, `connector: boolean` | `relative flex items-center gap-2.5 py-2`. Connector (when `connector`): `<span aria-hidden className="absolute left-[69px] top-[46px] -bottom-1.5 w-0.5 bg-[repeating-linear-gradient(180deg,var(--color-line-2)_0_3px,transparent_3px_6px)]" />`; `connector` = not the last visible row of its day (computed on the filtered list). Time `w-12 shrink-0 text-right text-13 font-semibold tabular-nums` ("9:55p"). `EmojiTile size=40 shape="circle"` (bg surface-2, emoji 18px, aria-hidden). Text `flex flex-1 min-w-0 flex-col gap-px`: title `text-15 font-semibold leading-[1.3] truncate`; sub `text-13 text-muted tracking-caption truncate`. Trailing: everyone → `AvatarStack size=22 overlap=-7 ring="white"` of `memberIds`; me → `ScopeBadge`. |
| `ScopeBadge` (P2-4 · `common/ScopeBadge.tsx`) | `scope: 'mine'\|'shared'\|'group'` | `Badge size="sm"` (h-[22px] px-2) `className="shrink-0 text-11 tracking-badge"` [11/700 0.04em]: `mine` → `variant="navy"` "MINE"; `shared` → `variant="peach"` "SHARED"; `group` → `variant="neutral"` "GROUP". |

View defaults: everyone opens on **map**, just me on **list** (design L1 vs L2). Switching scope resets view/area/sel to the target artboard's initial state (§1.5).

### 1.3 `GoaMap` contract (P1-6)

File `src/components/icons/custom/GoaMap.tsx`.

```ts
export interface GoaMapProps {
  area: 'trip' | 'goa';
  audience: 'everyone' | 'me';
  className?: string;
  children?: React.ReactNode; // extra SVG nodes painted last, inside <svg>; P3-13 passes none (HTML overlays are MapCard siblings)
}
```

Rendering rules:
- Root `<svg viewBox="0 0 388 480" role="img" aria-label={MAP_ART[area].ariaLabel} className={cn('block size-full font-sans', className)}>`. Replaces the design's `width="100%" height="480" style="display: block"`; the parent supplies the 388:480 aspect, default `preserveAspectRatio` (xMidYMid meet) so nothing letterboxes.
- Body = `MAP_ART[area].els.filter(e => e.aud === 'both' || e.aud === audience)` in array order (= design paint order), then `children`.
- Output must match the four verbatim SVGs in §2 element for element. Top-level child counts: trip/everyone 18, trip/me 13, goa/everyone 28, goa/me 20. Permitted differences only: React attribute casing, clip ids, image `href`s, per-`<text>` `font-family` (inherited `font-sans` instead, because next/font hashes the Figtree family name and the literal "Figtree" would fall back to system-ui), colours via token classes instead of hex attributes, and the root size attributes above.
- Colours: no hex in JSX. Data stores token names; render through static class maps written out in full (Tailwind scans literals): fills `fill-map-sea fill-map-land fill-map-label fill-muted fill-faint fill-ink fill-go fill-white`; strokes `stroke-map-road stroke-info stroke-teal stroke-amber-2 stroke-go stroke-ink`; badge/hub hairline `stroke-ink/12` (= `stroke="#0B1B3F" stroke-opacity="0.12"`).
- Ids: `const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')`; clipPath id `${uid}-${el.id}`. The design prefixes (`mallt*`, `mmet*`, `mallg*`, `mmeg*`) are not reused; two maps on one page never collide.
- Images: `href` resolved from `assets` (P0-4) by `img` key (§1.4).

Element recipes (Appendix B):

| `t` | Renders |
|---|---|
| `rect` | `<rect width={388} height={480} className={FILL[tone]} />` |
| `shape` | `<path d={d} className={FILL[tone]} />` (trip land polygon, goa sea strip) |
| `road` | `<path d={d} className="stroke-map-road" strokeWidth={w} fill="none" />` (w 5 or 4) |
| `route` | `<path d={d} className={STROKE[tone]} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 7" fill="none" />` then badge `<g><circle cx cy r={13} className="fill-white stroke-ink/12" /><text x={cx} y={ty} textAnchor="middle" fontSize={13}>{emoji}</text></g>` |
| `hub` | `<g><circle cx cy r={15} className="fill-white stroke-ink/12" /><text x={cx} y={ty} textAnchor="middle" fontSize={15}>{emoji}</text></g>` |
| `photo` | `<g><clipPath id={cid}><circle cx cy r={ri} /></clipPath><circle cx cy r={r} className={ring === 'go' ? 'fill-go' : 'fill-white'} /><image href={src} x={cx-ri} y={cy-ri} width={2*ri} height={2*ri} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${cid})`} /></g>` |
| `dot` | `<circle cx cy r={3} className="fill-faint" />` |
| `label` | `<text x y textAnchor={anchor} fontSize={size} fontWeight={700} letterSpacing={0.6} className={FILL[tone]}>{text}</text>` |

Geometry — `MAP_ART.trip` (`ariaLabel` "Map of how everyone gets to Goa", both audiences):

| # | aud | t | Data | Tone |
|---|---|---|---|---|
| 1 | both | rect | 388×480 | map-sea |
| 2 | both | shape | `M73 0 L71 6 L75 31 L73 63 L75 87 L79 107 L83 127 L93 168 L103 208 L111 236 L125 265 L139 293 L151 329 L163 357 L175 377 L194 410 L206 442 L214 470 L226 494 L388 520 L388 0 Z` | map-land |
| 3 | both | label | x14 y300 start 9 "ARABIAN SEA" | map-label |
| 4 | both | route | `M266 330 Q213 245 114 226` · badge 201,262 ty266 ✈️ | info |
| 5 | everyone | route | `M76 84 Q52 167 114 226` · badge 74,161 ty165 🚆 | teal |
| 6 | everyone | route | `M115 106 Q151 167 114 226` · badge 133,167 ty171 🚌 | amber-2 |
| 7 | me | dot | 76,84 | faint |
| 8 | me | label | x76 y100 middle 9 "MUMBAI" | faint |
| 9 | me | dot | 115,106 | faint |
| 10 | me | label | x115 y122 middle 9 "PUNE" | faint |
| 11 | both | photo | id `blr0` · 266,330 r16 ri13 · img `aarav` | white |
| 12 | everyone | photo | id `blr1` · 284,330 r16 ri13 · img `arjun` | white |
| 13 | everyone | label | x275 y308 middle 10 "BENGALURU" | muted |
| 14 | me | label | x266 y308 middle 10 "BENGALURU" | muted |
| 15 | everyone | photo | id `bom0` · 76,84 r16 ri13 · img `rahul` | white |
| 16 | everyone | label | x76 y114 middle 10 "MUMBAI" | muted |
| 17 | everyone | photo | id `pnq0` · 115,106 r16 ri13 · img `priya` | white |
| 18 | everyone | label | x135 y110 start 10 "PUNE" | muted |
| 19 | both | photo | id `goa` · 114,226 r21 ri18 · img `goaPin` | go |
| 20 | both | label | x140 y230 start 12 "GOA" | ink |

Geometry — `MAP_ART.goa` (`ariaLabel` "Places in Goa and how you get between them"):

| # | aud | t | Data | Tone |
|---|---|---|---|---|
| 1 | both | rect | 388×480 | map-land |
| 2 | both | shape | `M0 0 H70 C 58 60, 40 120, 50 180 C 58 240, 40 300, 70 370 C 84 420, 70 450, 74 480 H0 Z` | map-sea |
| 3 | both | road | `M0 360 C 80 370, 180 290, 388 250` · w5 | map-road |
| 4 | both | road | `M150 0 C 170 90, 220 200, 250 480` · w4 | map-road |
| 5 | both | label | x12 y290 start 9 "ARABIAN" | map-label |
| 6 | both | label | x12 y302 start 9 "SEA" | map-label |
| 7 | both | route | `M128 214 Q130 156 100 106` · badge 122,158 ty163 🛵 | go |
| 8 | both | route | `M128 214 Q125 263 150 306` · badge 132,262 ty266 🚤 | info |
| 9 | both | route | `M128 214 Q244 178 322 84` · badge 235,164 ty168 🚕 | ink |
| 10 | everyone | route | `M128 214 Q219 210 292 156` · badge 214,197 ty202 🚕 | teal |
| 11 | everyone | route | `M128 214 Q182 232 238 218` · badge 183,224 ty229 🚕 | amber-2 |
| 12 | both | hub | 322,84 ty89 ✈️ | — |
| 13 | both | label | x322 y116 middle 9 "MOPA AIRPORT" | muted |
| 14 | everyone | hub | 292,156 ty161 🚆 | — |
| 15 | everyone | label | x292 y188 middle 9 "THIVIM" | muted |
| 16 | everyone | hub | 238,218 ty223 🚌 | — |
| 17 | everyone | label | x238 y250 middle 9 "MAPUSA" | muted |
| 18 | both | photo | id `gv` · 128,214 r21 ri18 · img `goaPin` | go |
| 19 | both | label | x128 y246 middle 9 "VILLA SOL" | muted |
| 20 | both | photo | id `gc` · 100,106 r18 ri15 · img `chapora` | white |
| 21 | both | label | x100 y138 middle 9 "CHAPORA FORT" | muted |
| 22 | both | hub | 150,306 ty311 🤿 | — |
| 23 | both | label | x172 y310 start 9 "GRANDE ISLAND" | muted |

Responsiveness rule (deviation from the design's 1:1 px assumption): the card is `w-full aspect-[388/480]` (328×406 at a 360px frame, 388×480 at 420, 418×517 at 450). `MapSpotButton` centres are percentages of the 388×480 viewBox (`left: x/388*100%`, `top: y/480*100%`, centred with `-translate-x-1/2 -translate-y-1/2`), so hit targets follow the pins at every width, including below 420px. Button size stays 44px and the ring geometry is unchanged.

### 1.4 Data

Types are PLAN §9.1 (`ItineraryItem`, `MapSpot`, `MapCard`). `SpotKey = 'blr'|'bom'|'pnq'|'goa'|'villa'|'chapora'|'grande'|'mopa'|'thivim'|'mapusa'`.

**`src/data/seed/itinerary.ts` (P2-1)**
- `ITINERARY_DAYS = [{ key: 'fri', label: 'FRI 6 NOV' }, { key: 'sat', label: 'SAT 7 NOV' }, { key: 'sun', label: 'SUN 8 NOV' }, { key: 'mon', label: 'MON 9 NOV' }]`.
- `ITINERARY: ItineraryItem[]`: **12** items in display order (PLAN §9.2 says 13; the design has 12). `mine` semantics: omitted → same text in Just me; object → overrides (absent `time`/`emoji` keep the everyone value); `null` → hidden in Just me. `scope` renders only in Just me (hidden rows carry `'group'`). Users: `aarav` = You.

| id | day | time | emoji | title | sub | memberIds | scope | mine |
|---|---|---|---|---|---|---|---|---|
| `fri-land` | fri | 9:55p | 🛬 | You + Arjun land at Mopa | 6E 5313 from Bengaluru | aarav, arjun | mine | `{ time: '8:40p', emoji: '✈️', title: 'BLR → GOX · 6E 5313', sub: 'Seat 14A · lands Mopa 9:55 pm' }` |
| `fri-cab` | fri | 10:10p | 🚕 | Cab to Villa Sol | Shared · ₹800 each | aarav, arjun | shared | `{ title: 'Cab to Villa Sol', sub: 'With Arjun · 50 min · ₹800 each' }` |
| `fri-checkin` | fri | 11:00p | 🏡 | Check in · Villa Sol | Late check-in confirmed | aarav, arjun | group | `{ title: 'Check in · Villa Sol', sub: 'Late check-in confirmed by Go' }` |
| `sat-priya` | sat | 9:15a | 🚌 | Priya arrives at Mapusa | AC sleeper from Pune | priya | group | `null` |
| `sat-rahul` | sat | 10:30a | 🚆 | Rahul arrives at Thivim | Overnight train from Mumbai | rahul | group | `null` |
| `sat-scooters` | sat | 4:00p | 🛵 | Scooters & sunset | Anjuna to Chapora Fort | aarav, rahul, priya, arjun | group | omitted |
| `sun-scuba` | sun | 9:00a | 🤿 | Scuba, Grande Island | 2 going · ₹7,000 each | aarav, priya | group | `{ title: 'Scuba, Grande Island', sub: 'You said yes · ₹7,000' }` |
| `mon-checkout` | mon | 11:00a | 🏡 | Check out | Villa Sol | aarav, rahul, priya, arjun | group | omitted |
| `mon-cab` | mon | 1:30p | 🚕 | Cab to Mopa | Go is booking | aarav, arjun | shared | `{ title: 'Cab to Mopa', sub: 'With Arjun · Go is booking' }` |
| `mon-fly` | mon | 4:10p | 🛫 | You + Arjun fly home | 6E 6142 · lands 5:25 pm | aarav, arjun | mine | `{ emoji: '✈️', title: 'GOX → BLR · 6E 6142', sub: 'Lands 5:25 pm' }` |
| `mon-priya` | mon | 8:30p | 🚌 | Priya’s bus to Pune | From Mapusa | priya | group | `null` |
| `mon-rahul` | mon | 9:40p | 🚆 | Rahul’s train to Mumbai | From Thivim | rahul | group | `null` |

Rows per day: everyone 3/3/1/5 = 12; just me 3/1/1/3 = 8. `selectItinerary(scope)` (P2-2) returns `{ day, label, rows }[]` with `mine` applied, `null` rows dropped and empty days dropped; P3-13 derives `connector`.

**`src/data/seed/map.ts` (P2-1)** — `export * from './mapArt'` plus:
- `MAP_NAMES: Record<SpotKey, string>` (spot aria-labels): blr "Bengaluru route", bom "Mumbai route", pnq "Pune route", goa "Goa", villa "Villa Sol", chapora "Chapora Fort", grande "Grande Island", mopa "Mopa Airport", thivim "Thivim station", mapusa "Mapusa bus stand".
- `MAP_SPOTS: MapSpot[]` in this order (`label = MAP_NAMES[key]`); visible = `area === current && (audience === 'both' || audience === scope)` → trip/everyone 7, trip/me 3, goa/everyone 11, goa/me 7.

| # | key | x | y | area | audience | Target |
|---|---|---|---|---|---|---|
| 1 | goa | 114 | 226 | trip | both | GOA pin |
| 2 | blr | 275 | 330 | trip | everyone | between You + Arjun pins |
| 3 | blr | 266 | 330 | trip | me | You pin |
| 4 | blr | 201 | 262 | trip | both | ✈️ route badge |
| 5 | bom | 76 | 84 | trip | everyone | Rahul pin |
| 6 | bom | 74 | 161 | trip | everyone | 🚆 route badge |
| 7 | pnq | 115 | 106 | trip | everyone | Priya pin |
| 8 | pnq | 133 | 167 | trip | everyone | 🚌 route badge |
| 9 | chapora | 122 | 158 | goa | both | 🛵 route badge |
| 10 | grande | 132 | 262 | goa | both | 🚤 route badge |
| 11 | mopa | 235 | 164 | goa | both | 🚕 route badge |
| 12 | thivim | 214 | 197 | goa | everyone | 🚕 route badge |
| 13 | mapusa | 183 | 224 | goa | everyone | 🚕 route badge |
| 14 | mopa | 322 | 84 | goa | both | ✈️ hub |
| 15 | thivim | 292 | 156 | goa | everyone | 🚆 hub |
| 16 | mapusa | 238 | 218 | goa | everyone | 🚌 hub |
| 17 | villa | 128 | 214 | goa | both | Villa Sol pin |
| 18 | chapora | 100 | 106 | goa | both | Chapora Fort pin |
| 19 | grande | 150 | 306 | goa | both | 🤿 hub |

- `MAP_CARDS: Record<SpotKey, MapCard>`; resolved card = `audience === 'me' ? { ...card, ...card.me } : card`.

| key | icon | title | sub | line | button | action | `me` overrides |
|---|---|---|---|---|---|---|---|
| blr | ✈️ | You + Arjun · from Bengaluru | IndiGo 6E 5313 · Fri 8:40 pm → 9:55 pm | Back Mon 9 Nov · 6E 6142 · 4:10 pm | Flight details | href `/trips/goa?open=fly` | title "Your flight from Bengaluru"; line "Back Mon 9 Nov · 6E 6142 · 4:10 pm · with Arjun" |
| bom | 🚆 | Rahul · from Mumbai | Overnight train · reaches Thivim Sat 10:30 am | Back Mon 9 Nov · 9:40 pm from Thivim | Message Rahul | href `/trips/goa/chat` | — (no me spot) |
| pnq | 🚌 | Priya · from Pune | AC sleeper · reaches Mapusa Sat 9:15 am | Back Mon 9 Nov · 8:30 pm from Mapusa | Message Priya | href `/trips/goa/chat` | — (no me spot) |
| goa | 🏡 | Goa · Villa Sol, Anjuna | Fri 6 – Mon 9 Nov · all 4 of you | Everyone is in by Sat 10:30 am | See places in Goa | `{ kind: 'goa' }` | sub "Fri 6 – Mon 9 Nov · your stay"; line "You check in Fri 11 pm" |
| villa | 🏡 | Villa Sol · Anjuna | Check in Fri 6 Nov · 11 pm, late check-in confirmed | Check out Mon 9 Nov · 11 am | Directions | toast "Opens directions to Villa Sol in Google Maps" | — |
| chapora | 🛵 | Chapora Fort | Sat 7 Nov · 4:00 pm · scooters and sunset | 🛵 about 15 min from the villa | Directions | toast "Opens directions to Chapora Fort in Google Maps" | — |
| grande | 🤿 | Scuba · Grande Island | Sun 8 Nov · 9:00 am · you + Priya | 🚤 boat out · ₹7,000 each | Directions | toast "Opens directions to Scuba in Google Maps" | — |
| mopa | ✈️ | Mopa Airport (GOX) | You + Arjun land Fri 9:55 pm | 🚕 about 50 min to the villa | Directions | toast "Opens directions to Mopa Airport (GOX) in Google Maps" | sub "You land Fri 9:55 pm, with Arjun" |
| thivim | 🚆 | Thivim station | Rahul arrives Sat 10:30 am | 🚕 about 30 min to the villa | Directions | toast "Opens directions to Thivim station in Google Maps" | — |
| mapusa | 🚌 | Mapusa bus stand | Priya arrives Sat 9:15 am | 🚕 about 20 min to the villa | Directions | toast "Opens directions to Mapusa bus stand in Google Maps" | — |

Toast texts are stored literally; they equal the design's `'Opens directions to ' + title.split(' · ')[0] + ' in Google Maps'`.
- `MAP_COPY = { hint: 'Tap a pin or a dotted route', areaLabel: 'Map area', areas: { trip: 'Getting there', goa: 'In Goa' }, close: 'Close' }`. Toggle copy in `copy.ts`: `scopeToggle: { label: 'Whose plan', everyone: 'Everyone', me: 'Just me' }`, `viewToggle: { label: 'View', list: 'List view', map: 'Map view' }`.

**`src/data/seed/mapArt.ts` (P1-6; sequencing exception)** — PLAN §10 runs P1-6 (Phase 1) before P2-1 (Phase 2, owns `src/data/**`), yet `GoaMap` renders from map data. So P1-6 also owns `src/data/seed/mapArt.ts`: `MAP_ART: Record<MapArea, { ariaLabel: string; els: MapEl[] }>` with the two §1.3 geometry tables, plus local types:

```ts
export type MapArea = 'trip' | 'goa';
export type MapAudience = 'everyone' | 'me';
type Aud = MapAudience | 'both';
export type MapTone = 'map-sea'|'map-land'|'map-road'|'map-label'|'muted'|'faint'|'ink'|'go'|'info'|'teal'|'amber-2'|'white';
export type MapImg = 'aarav' | 'arjun' | 'rahul' | 'priya' | 'goaPin' | 'chapora';
export type MapEl =
  | { t: 'rect'; aud: Aud; tone: MapTone }
  | { t: 'shape'; aud: Aud; d: string; tone: MapTone }
  | { t: 'road'; aud: Aud; d: string; w: 4 | 5 }
  | { t: 'route'; aud: Aud; d: string; tone: MapTone; badge: { cx: number; cy: number; ty: number; emoji: string } }
  | { t: 'hub'; aud: Aud; cx: number; cy: number; ty: number; emoji: string }
  | { t: 'photo'; aud: Aud; id: string; cx: number; cy: number; r: 16 | 18 | 21; ri: 13 | 15 | 18; ring: 'white' | 'go'; img: MapImg }
  | { t: 'dot'; aud: Aud; cx: number; cy: number }
  | { t: 'label'; aud: Aud; x: number; y: number; anchor: 'start' | 'middle'; size: 9 | 10 | 12; tone: MapTone; text: string };
```
`map.ts` re-exports it and never edits it. The orchestrator adds this path to P1-6's OWNS.

**`assets` (P0-4, `src/lib/assets.ts`)** — `MapImg` → image:
- `aarav`/`arjun`/`rahul`/`priya` → the avatar entries (`/images/avatars/<id>.jpg`; design blobs `c58d…`, `8c7b…`, `cb0a…`, `234f…`).
- `chapora` → `/images/photos/chapora-fort.jpg` (design blob `bd2ea540983c3f8a7f6f21e35f940d7b`, 30px in a r15 clip).
- `goaPin` → `/images/photos/goa-beach.jpg` (design blob `fc24c13d453081240effb71837c10e56`, 36px in a r18 clip, used for both the GOA and VILLA SOL pins). PLAN §12.3 has no entry for this image; reuse goa-beach until a dedicated asset is supplied.

### 1.5 Interactions → actions

| Element | Action | State change | URL / side effect |
|---|---|---|---|
| ScopeToggle "Everyone" | `setScope('everyone')` | view `map`, area `trip`, sel `blr` (= P-Plan-Everyone initial state) | `replaceState` (§12.1 #19); design: page link |
| ScopeToggle "Just me" | `setScope('me')` | view `list`, area `trip`, sel `none` (= P-Plan-Mine initial state) | `replaceState`; design: page link |
| ViewToggle "List view" / "Map view" | `setView(v)` | view only; area and sel kept | `replaceState` |
| MapScopeSwitch "Getting there" / "In Goa" | `setArea(a)` | area; sel `none` → hint pill | `replaceState` |
| MapSpotButton (pin or route badge) | `select(key)` | sel = key (re-tap: no change); ring on every spot with that key | `replaceState` |
| MapDetailCard ✕ (`aria-label="Close"`) | `close()` | sel `none` → hint pill | `replaceState` |
| CTA "Flight details" (blr, both audiences) | navigate | — | `<Link href="/trips/goa?open=fly">` (push); trip home opens the Flights row (`J-triphome-calls.md`) |
| CTA "Message Rahul" (bom) / "Message Priya" (pnq) | navigate | — | `<Link href="/trips/goa/chat">` |
| CTA "See places in Goa" (goa) | drill-down | area `goa`, sel `villa` (= L3; in Just me → goa/me map with villa) | `replaceState` |
| CTA "Directions" (villa, chapora, grande, mopa, thivim, mapusa) | `toastGo(action.text)` | none; card stays open | navy toast 2200ms |
| Shell (TripShell, P2-6) | — | — | hero/compact back → `/home`; tabs Home `/trips/goa` · Itinerary self · Bookings `/trips/goa/bookings` · Expenses `/trips/goa/expenses`; hero/compact share → `ShareInviteSheet`; Chat FAB → `/trips/goa/chat`; compact header fades in 110→200px scroll |

Entering via the Itinerary tab (bare `/trips/goa/itinerary`) resolves to the L1 state through the §1.1 defaults.

### 1.6 Deviations (each flagged in code with `// DESIGN-ASSUMPTION`)

1. **Scope toggle is local state** (PLAN §12.1 item 19): the design links two files (`P-Plan-Everyone` ↔ `P-Plan-Mine`); here `scope` is local state synced to `?scope=` via `replaceState`. A switch resets view/area/sel to the target artboard's initial state so the result matches the design's page load.
2. **Percentage-positioned hit targets**: the design positions spot buttons in absolute px and relies on a 388px card (1:1 viewBox). Here the card is `w-full aspect-[388/480]` and spots are placed at `x/388`, `y/480` percentages, so they track the pins below and above 420px. Button size stays 44px.
3. **`goa` card only in the trip area**, as designed: goa-area spots have no `goa` key; `villa` is its in-Goa counterpart. A deep link `area=goa&sel=goa` resolves to `none`.
4. **No legend** chip and **no image** in the detail card (emoji tile only), as designed.
5. **`sel=none` sentinel and canonical URLs**: PLAN §8 defines `?sel=<spotKey>` with no null value. `none` is added so a closed card survives reload, given that `sel` defaults to `blr` on the everyone/trip map.
6. **SVG font**: `font-family="Figtree, system-ui, sans-serif"` is replaced by inherited `font-sans` (next/font hashed family).
7. **CTA weight**: `Button primary` defaults to `font-medium`; the card CTA overrides to `font-semibold` (design 13/600). The `ScopeBadge` overrides Badge `sm` text-12 → `text-11` (design 11px).
8. **Link targets**: `P-Home-FlyOpen.dc.html` → `/trips/goa?open=fly`; `P-Chat-Plan.dc.html` → `/trips/goa/chat` (PLAN §8.1).
9. Kept as designed, not fixed: grande's toast says "Scuba" ("Opens directions to Scuba in Google Maps"); the timeline connector sits at `left-[69px]`, 9px left of the 40px tile's centre (78px); both trip SVG variants share the aria-label "Map of how everyone gets to Goa".

### 1.7 Acceptance checklist

Global: `pnpm exec tsc --noEmit && pnpm lint` clean; every itinerary string above appears verbatim in `src/data/seed/{itinerary,map,copy}.ts`, none hard-coded in components; no hex in `className`.

**L1** (`/home?preset=L1`, or the Itinerary tab once the trip is planned)
- [ ] Hero + tabs with Itinerary active; canonical URL `?scope=everyone&view=map&area=trip&sel=blr`.
- [ ] Control row: "Everyone" active (black, 20px Rahul/Priya/Arjun stack ringed white, overlap −7); "Just me" muted with the 22px own avatar; Map view selected (40px black circle), List view transparent/muted.
- [ ] Map card at a 420px frame is 388×480, r22, `bg-map-land`, shadow-card; trip/everyone SVG matches §2 (18 top-level children): 3 dotted routes (blue ✈️, green 🚆, amber 🚌), 4 person pins, terracotta GOA pin, labels, "ARABIAN SEA".
- [ ] "Getting there" selected in the scope chip (top-left, 10/10).
- [ ] Terracotta ring (3px go + 4px halo) on **both** blr targets (275,330 and the ✈️ badge 201,262); hint pill hidden.
- [ ] Card: ✈️ · "You + Arjun · from Bengaluru" · "IndiGo 6E 5313 · Fri 8:40 pm → 9:55 pm" · "Back Mon 9 Nov · 6E 6142 · 4:10 pm" · "Flight details" → `/trips/goa?open=fly`.
- [ ] Tap 🚆 badge → ring on both bom targets, card "Rahul · from Mumbai", "Message Rahul" → chat. Tap GOA pin → "Goa · Villa Sol, Anjuna"; "See places in Goa" → L3 state.
- [ ] ✕ → card closes, hint "Tap a pin or a dotted route" appears, URL `sel=none`. "In Goa" → goa map, no card, hint shown.
- [ ] List view: 4 day cards (FRI 6 NOV … MON 9 NOV), 12 rows with 22px avatar stacks per §1.4; 8 connectors (Fri 2, Sat 2, Sun 0, Mon 4).
- [ ] Data note: Mon 4:10p 🛫 "You + Arjun fly home" shows [You, Arjun]. The Bookings "Everyone home" card (M1: "1 flight · 1 train · 1 bus", avatars You, Rahul, Priya) contradicts this (Arjun flies home with You). That is a design inconsistency owned by `M-bookings-money.md`; do not change itinerary data to match it.
- [ ] At a 360px frame (card 328×406) every spot button stays centred on its pin/badge.

**L3** (`/home?preset=L3`)
- [ ] goa/everyone SVG matches §2 (28 children): 5 dotted routes from Villa Sol (🛵 terracotta, 🚤 blue, 🚕 ink, 🚕 green, 🚕 amber), hubs ✈️ 🚆 🚌 🤿, Chapora photo pin, terracotta Villa Sol pin, 9px labels.
- [ ] "In Goa" selected; 11 spot buttons; ring only on villa (128,214).
- [ ] Card: 🏡 · "Villa Sol · Anjuna" · "Check in Fri 6 Nov · 11 pm, late check-in confirmed" · "Check out Mon 9 Nov · 11 am" · "Directions" button → toast "Opens directions to Villa Sol in Google Maps" (2200ms); card stays open.
- [ ] Tap Chapora → ring on both chapora targets (122,158 badge and 100,106 pin).
- [ ] "Getting there" → trip map, sel `none`, hint shown.

**L2** (`/home?preset=L2`)
- [ ] "Just me" active (black, own 22px avatar), "Everyone" muted; List view selected.
- [ ] 4 day cards, 8 rows: Fri 8:40p ✈️ "BLR → GOX · 6E 5313" / "Seat 14A · lands Mopa 9:55 pm" MINE; 10:10p 🚕 SHARED; 11:00p 🏡 "Late check-in confirmed by Go" GROUP · Sat 4:00p 🛵 GROUP · Sun 9:00a 🤿 "You said yes · ₹7,000" GROUP · Mon 11:00a 🏡 GROUP; 1:30p 🚕 "With Arjun · Go is booking" SHARED; 4:10p ✈️ "GOX → BLR · 6E 6142" / "Lands 5:25 pm" MINE.
- [ ] Badges: MINE navy/white, SHARED go-soft/go, GROUP surface-2/muted; 22px tall, 11/700.
- [ ] Connectors only on Fri rows 1–2 and Mon rows 1–2. No Priya bus or Rahul train rows.
- [ ] Map view → trip/me SVG (13 children): dimmed MUMBAI/PUNE dots, only the You pin at Bengaluru (label at x266), 3 spot buttons, no card, hint shown.
- [ ] Tap blr → "Your flight from Bengaluru" / line "Back Mon 9 Nov · 6E 6142 · 4:10 pm · with Arjun". Tap GOA → sub "Fri 6 – Mon 9 Nov · your stay", line "You check in Fri 11 pm"; "See places in Goa" → goa/me map (20 children, no Thivim/Mapusa), 7 spots, villa selected.
- [ ] mopa card sub "You land Fri 9:55 pm, with Arjun".
- [ ] "Everyone" → map/trip/blr (L1).

### 1.8 Consumed by tasks

| Task | Uses | Produces |
|---|---|---|
| **P1-6** Custom SVG components | §1.3, §1.4 `mapArt.ts`, §2 verbatim SVGs + Appendix B | `icons/custom/GoaMap.tsx`, `src/data/seed/mapArt.ts` (exception, §1.4) |
| **P2-4** Common domain composites | §1.2 rows `ScopeToggle`, `ViewToggle`, `ScopeBadge` | `common/ScopeToggle.tsx`, `common/ViewToggle.tsx`, `common/ScopeBadge.tsx` |
| **P2-1** Types + seeds (seed) | §1.4 (`itinerary.ts`, `map.ts`, `copy.ts` keys), §1.1 preset ids | `src/data/seed/itinerary.ts`, `src/data/seed/map.ts`, preset ids `L1`/`L2`/`L3` |
| **P3-13** Itinerary page | all of §1 | `app/trips/[tripId]/itinerary/page.tsx`, `plan/{MapCard,MapSpotButton,MapScopeSwitch,MapHintPill,MapDetailCard,DayCard,TimelineRow}.tsx` |

Also relevant: P2-2 (`selectItinerary(scope)`, preset fill), P2-6 (`TripShell`), P3-16 (`ItineraryZero`).

---

## 2. Inventory (reference)

Verbatim from the group L+M design inventory. Edits: headings demoted one level; PLAN §7 names added in [brackets] after the proposed component names in the group notes; Bookings/Money sections omitted (→ `M-bookings-money.md`). SVG blocks are byte-exact.

Inventory label → PLAN §7 component: Whose-plan segmented → `ScopeToggle` · View toggle → `ViewToggle` · Map card → `MapCard` · Trip/Goa SVG → `GoaMap` · Hit targets → `MapSpotButton` · Scope switch → `MapScopeSwitch` · Hint pill → `MapHintPill` · Map detail card → `MapDetailCard` · Day card → `DayCard` · Time row → `TimelineRow` · scope badge → `ScopeBadge` · Plan shell → `TripShell` (`TripHero`, `TripTabs`, `CollapsingTripHeader`, `ChatFab`) · Share sheet → `ShareInviteSheet` · Toast → sonner `toastGo`.

### 0. Shared preamble (applies to every screen below unless noted)

#### 0.1 Global `<style>` (identical in all 9 files)
```
body{margin:0}  a{color:#0B1B3F}  :root{--ease-out:cubic-bezier(0.23,1,0.32,1)}
a,button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-touch-callout:none;
  transition:transform 160ms var(--ease-out),box-shadow 180ms ease,background-color 180ms ease,opacity 180ms ease}
a:active,button:active{transform:scale(0.97); transition-duration:160ms,60ms,60ms,60ms}
.row{transition:transform 160ms var(--ease-out),border-color 150ms ease,box-shadow 150ms ease}
.row:active{transform:scale(0.985); background-color:#F5F6F8 !important}
:is(a,button)[style*="background: #000000"]:active{box-shadow:inset 0 0 0 999px rgba(255,255,255,0.18)}
:is(a,button):not(.row):is([bg #F2F2F2|#F4F5F7|#F6EAE6|#FFFFFF|transparent]):active{box-shadow:inset 0 0 0 999px rgba(11,27,63,0.07)}
a:not([style*="background"]):active{opacity:0.6}
@media (hover:hover) and (pointer:fine){a:hover{color:#22365F}}
.tick{transition:transform 200ms,opacity 200ms var(--ease-out)} @starting-style{.tick{transform:scale(0.8);opacity:0}}
.enter{transition:opacity 220ms,transform 220ms var(--ease-out)} @starting-style{.enter{opacity:0;transform:translateY(6px)}}
prefers-reduced-motion: no scale on :active; .tick/.enter → opacity 150ms only
input::placeholder{color:#4A5878}
.live{animation:live 1600ms ease-in-out infinite} @keyframes live{50%{box-shadow:0 0 0 7px rgba(22,163,74,0.12)}}
[role="dialog"]>div>*{flex-shrink:0}
```
P-Money-Record adds a toggle-knob rule (unused in markup, see M7):
`button[aria-pressed="false"]>span>.knob{transform:none} button[aria-pressed="true"]>span>.knob{transform:translateX(18px)} button[aria-pressed="false"]>span:has(.knob){background:#CDD3DC !important} .knob{transition:transform 200ms var(--ease-out)}`
Font link: Google Fonts Figtree 400–800. Font stack `'Satoshi','Figtree',system-ui,sans-serif`; `font-kerning:normal; text-rendering:optimizeLegibility; -webkit-font-smoothing:antialiased`.

#### 0.2 Design tokens seen in this group
- Ink `#0B1B3F` · secondary text `#4A5878` · muted icon `#A5ACB8` · page bg `#F6F7F9` · card `#FFFFFF`
- Hairline borders `#ECEFF3` · input/chip borders + dashed lines `#DDE1E6` · tile/neutral fill `#F4F5F7` · nudge fill `#F2F2F2` · bar track `#ECEFF3`
- Primary button/active segment `#000000` + `#FFFFFF` text
- Terracotta accent `#A44F3A` (Goa pin ring, selection ring, unread badge, "your debt" amount, SHARED badge text) with tint `#F6EAE6`
- Blue `#3E73D6` (flight route, Stay bar/dot, transport accent stripe) · tint `#E3EEFB`
- Coral `#E07A5F` (Travel bar/dot) · tint `#FBE8DC`
- Green `#16A34A` (BOOKED/settled check), green text `#0F7A37`; route green `#2BB38A`; route amber `#E3A63A`
- Map land `#F1EFE8`, sea `#D6EAE6`, sea label `#8FB3AD`, road `#E4E1D6`
- IndiGo brand panel `#2B399B`; WhatsApp `#25D366`; share icon tile `#FFF1DC`; Go avatar bg `#DCEBFF`
- Card shadow (standard): `0 1px 2px rgba(11,27,63,0.05), 0 6px 18px rgba(11,27,63,0.06)`
- Eyebrow text: 11px / 700 / `#4A5878` / letter-spacing 0.08em / line-height 1.35, UPPERCASE
- Secondary line: 13px / `#4A5878` / letter-spacing 0.002em / line-height 1.35

#### 0.3 People / avatar blobs (consistent across files)
| Person | blob | home city / mode |
|---|---|---|
| You (current user) | `/_blob/c58d972a22611bbd2e2f8570c48c72b8` | Bengaluru, flies IndiGo with Arjun |
| Rahul | `/_blob/cb0a34fddc3af7464df32602b63b30fa` | Mumbai, overnight train (paid villa; is the creditor) |
| Priya | `/_blob/234f094a59fd64a1b23f7ec0e8d4cc45` | Pune, AC sleeper bus |
| Arjun | `/_blob/8c7b7cb247d8cdf696b9f9eb4567da93` | Bengaluru, flies with You |
| Go (assistant) | `/_blob/5bda4ac2e39242651eeed457db2d1a9c` (bg `#DCEBFF`) | chat FAB only |
Standard 4-stack order: You, Rahul, Priya, Arjun. "Everyone" toggle stack: Rahul, Priya, Arjun (3, no You).
No per-member avatar colours exist — avatars are always photos.

#### 0.4 Plan shell (brief — documented in depth by the empty-state reader)
Root: `position:relative; width:420px; height:912px; display:flex; flex-direction:column; background:#F6F7F9; color:#0B1B3F; overflow:hidden`.
1. **Scroller** `div onScroll={{onScroll}}`: `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column`.
2. **Hero** (inside scroller) 236px, bg `#E9945A`, image `/_blob/1d74f508f447c4a1bb476cb83c275f7d` (alt "Palm silhouette against a Goa sunset over the sea") `object-fit:cover`, overlay `linear-gradient(180deg, rgba(11,27,63,.25) 0%, rgba(11,27,63,0) 26%, rgba(11,27,63,.08) 42%, rgba(11,27,63,.4) 62%, rgba(11,27,63,.72) 100%)`.
   - Back glass button (→ `P-App-Home.dc.html`) abs top 46 left 14, 40×40 circle, bg `rgba(11,27,63,0.35)`, `backdrop-filter:blur(12px)`, white arrow-left 20px.
   - Share glass button (role=button, `pa_0` → open share sheet) abs top 46 right 14, same style, share-arrow 18px.
   - Title block abs left/right 20 bottom 42, white: "📍 Goa" (pin emoji 30px in 30px slot, gap 4) 40px/700/-0.03em/lh 1; then 2 lines 15px/500/lh 1.35 nowrap with 18px emoji slots, gap 6: "📅 Fri 6 – Mon 9 Nov", "⏳ in 34 days". Right: 4-avatar stack 28px, border 2px #FFF, overlap -8px.
3. **Big tab bar** `role=tablist "Trip sections"`: `position:relative; z-index:2; margin:-26px 16px 0; padding:5px; gap:2px; radius 999; bg #FFF; shadow 0 1px 2px rgba(11,27,63,.06), 0 8px 24px rgba(11,27,63,.12)`. Tabs (anchors): Home→`P-Home.dc.html`, Itinerary→`P-Plan-Everyone.dc.html`, Bookings→`P-Bookings.dc.html`, Expenses→`P-Money-Everyone.dc.html`. Each `flex:1; height:42px; radius 999; 15px/600`; active `#000/#FFF`, inactive `transparent/#4A5878`.
4. **Content column**: `padding:16px 16px 120px; display:flex; flex-direction:column; gap:10px`.
5. **Compact header** (sibling of scroller, `style={{headStyle}}`): `position:absolute; left:0; right:0; top:0; z-index:4; padding:46px 12px 10px; background:#FFF; box-shadow:0 1px 0 rgba(11,27,63,.05), 0 8px 20px rgba(11,27,63,.08); flex column; gap 8px;` + scroll-driven `opacity:hp; transform:translateY((1-hp)*-14 px); pointer-events: hp>0.6?auto:none; transition: opacity 140ms ease-out, transform 140ms ease-out; will-change:opacity,transform`.
   - Row (gap 6): back 40×40 plain (→ P-App-Home, arrow 20px), title column "Goa" 17px/700/-0.014em/lh1.2 + "Fri 6 – Mon 9 Nov" 13px secondary, share 40×40 plain (`pa_1`).
   - Compact tab bar: `padding:4px; gap:2px; radius 999; bg #F4F5F7`; tabs height 36, 14px/600, same targets/active styling.
   - `onScroll`: `t=scrollTop; hp = round(clamp((t-110)/90,0,1)*20)/20` (0.05 steps, fully shown at 200px); `collapsed = hp>=1`.
6. **Bottom fade**: abs bottom 0, height 120, `pointer-events:none`, `linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 70%)`.
7. **Chat FAB** (→ `P-Chat-Plan.dc.html`): abs bottom 28, centred (`left:50%; translateX(-50%)`), height 58, `padding:0 12px 0 8px`, gap 10, radius 999, bg #000, white, shadow `0 8px 24px rgba(11,27,63,.25)`. Avatars 36px, border 2px #000, overlap -12 (Go [bg #DCEBFF], Rahul, Priya, Arjun). Text: "Chat" 15px/600/-0.008em/lh1.25; preview "Priya: scuba’s on me 🤿" 12px rgba(255,255,255,.7)/0.01em nowrap. Unread badge "3": min-width 24, height 24, padding 0 7, radius 999, bg #A44F3A, 13px/700 tabular.
8. **Share sheet** (`sc-if pShare`, z 40): backdrop button `rgba(11,27,63,0.38)` (closes). Sheet `.enter role=dialog "Share trip invite"`: abs bottom, `padding:8px 16px 30px; radius 28px 28px 0 0; bg #F6F7F9; shadow 0 -8px 30px rgba(11,27,63,.18); gap 14`. Grabber 40×5 #DDE1E6. Invite card (padding 12, radius 18, white, border #ECEFF3): icon img `/_blob/63e0220f3d27d3795e1836f5d29b07d1` 44px r12 bg #FFF1DC, "Join Goa crew on Go" 15/600, "go.vestra.ai/t/goa-k7q" 13 secondary, "Copy" pill 36px #F4F5F7 13/600 (toast "Invite link copied", sheet stays). WhatsApp-group row (→ `P-WA-Compose.dc.html`, **file missing**): 44px circle #FFF1DC "🌴" + 18px #25D366 dot, "Goa crew 🌴" / "WhatsApp group · recent", chevron #A5ACB8. Target row of 5 (64px wide, 56px tiles r18): WhatsApp (→ `P-WA-Pick.dc.html`, **missing**; #25D366 tile, white chat-bubble svg 28px `M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z`), 💬 Messages, ✉️ Gmail, 🔗 Copy link, ⋯ More — each toasts and closes.
9. **Toast** (`sc-if pToast`): `.enter role=status`, abs bottom 108, centred, z 60, max-width 340, padding 12 16, radius 16, bg #0B1B3F, white 14/600/lh1.35 centred, shadow `0 10px 30px rgba(11,27,63,.3)`. Auto-hide 2200ms (`_toast`).
Shared Component logic in every shell file: state `{pT:null, pShare:false, pSent:[]}`; `_toast(t)`; `_send()` (chat helper — unused on these screens). Toast copy: Messages → "Opens Messages with the link filled in"; Gmail → "Opens Gmail with the link filled in"; Copy link / Copy → "Invite link copied"; More → "Opens your phone’s share menu".

#### 0.5 Shared inline icons (24-unit viewBox, `fill:none; stroke:currentColor; round caps/joins`)
- Arrow-left (back): `M19 12H5` + `M11 6l-6 6 6 6`, stroke 2 (20px hero/compact, 22px Transactions/Record).
- Share (forward-curve): `M14 5l7 7-7 7` + `M21 12h-9a8 8 0 0 0-8 8`, stroke 2, 18px (20px on Record).
- Chevron-right: `M9 6l6 6-6 6`, stroke 2.4 (15–16px).
- Close X: `M6 6l12 12` + `M18 6L6 18` (stroke 2.4 @14px in map card; stroke 2 @18px on Record).
- Check: `M5 12l5 5 9-10`, stroke 4 (16px in BOOKED stub, 13px in settled row).
- List view: `M8 6h13`,`M8 12h13`,`M8 18h13`,`M3 6h.01`,`M3 12h.01`,`M3 18h.01`, stroke 2, 18px.
- Map view (folded map): `M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z` + `M9 4v14` + `M15 6v14`, stroke 2, 18px.
- Pencil (Edit budget): `M4 20h4L19 9l-4-4L4 16z`, stroke 2, 15px.
- Plus: `M12 5v14` + `M5 12h14`, stroke 2, 18px.

---

### P-Plan-Everyone.dc.html — "Go — Itinerary map"  (L1)
#### Purpose (1 line)
Itinerary tab, "Everyone" scope, map view on the "Getting there" map with the Bengaluru (flight) route pre-selected, showing its detail card.

#### Layout top→bottom
1. Shell hero + big tab bar (Itinerary active) — §0.4.
2. Content column (`padding:16px 16px 120px; gap 10`):
   **2a. Control row** `display:flex; align-items:center; gap:8px`:
   - **Whose-plan segmented** `role=tablist aria-label="Whose plan"`: `flex:1; padding:4px; gap:4px; radius 999; bg #FFF; border:1px solid #ECEFF3`. Two anchor tabs, each `flex:1; height:40px; radius 999; flex centre; gap 6; 15px/600`:
     - "Everyone" (→ `P-Plan-Everyone.dc.html`, aria-selected **true**, `bg #000; color #FFF`) prefixed by 3-avatar stack 20px (Rahul, Priya, Arjun; border 2px #FFF; overlap -7, container padding-left 7).
     - "Just me" (→ `P-Plan-Mine.dc.html`, inactive `color:#4A5878`, no bg) prefixed by You avatar 22px (no border).
   - **View toggle** `role=radiogroup aria-label="View"`: `padding:4px; gap:2px; radius 999; bg #FFF; border 1px #ECEFF3`. `sc-for modes` → 2 `button role=radio` 40×40 radius 999, border 0; selected `bg #000; color #FFF`, else `transparent; #4A5878`. [0] "List view" (list icon), [1] "Map view" (map icon). Here Map is selected.
   **2b. Map card** (`sc-if isMapV`): `position:relative; isolation:isolate; height:480px; radius 22px; overflow:hidden; bg #F1EFE8; standard card shadow`. Width = 420−32 = 388px, so the 388×480 viewBox renders **1:1 in px** (hit-target coordinates rely on this).
   - `sc-if isTrip` → **Trip SVG** (verbatim below). `sc-if isGoa` → **Goa SVG** (verbatim below).
   - **Hit targets** `sc-for spots` → transparent `<button aria-label=NAMES[k]>`: `position:absolute; z-index:1; left:x-22px; top:y-22px; width:44px; height:44px; padding:0; radius 999; background:transparent; cursor:pointer`. Selected (sel===k): `border:3px solid #A44F3A; box-shadow:0 0 0 4px rgba(164,79,58,0.18)` (terracotta ring around the pin / route badge); unselected `border:0` (invisible). Keys repeat (pin + route-midpoint badge share a key) so **both** get the ring when selected.
   - **Scope switch** (the "Getting there / In Goa" chip): `role=radiogroup aria-label="Map area"`, `position:absolute; left:10px; top:10px; z-index:2; padding:4px; gap:2px; radius 999; bg rgba(255,255,255,0.92); shadow 0 2px 10px rgba(11,27,63,0.12)`. `sc-for scopes` buttons `height:34px; padding:0 12px; border:0; radius 999; 13px/600`; selected `#000/#FFF`, else `transparent/#4A5878`. Labels: "Getting there" (trip), "In Goa" (goa). There is **no legend** chip.
   - **Hint pill** (`sc-if noCard`): `position:absolute; left:50%; bottom:14px; translateX(-50%); height:32px; padding:0 12px; radius 999; bg rgba(11,27,63,0.78); #FFF; 13px/600; nowrap; pointer-events:none` — "Tap a pin or a dotted route".
   - **Detail card** (`sc-if hasCard`) — see Sheets/overlays.
   **2c. List** (`sc-if isListV`, hidden here) — identical markup to the list documented below; Everyone list content:
   - Day card: `padding:12px 14px 8px 4px; radius 22; bg #FFF; standard card shadow`. Cards stacked with gap 10.
   - Day header: `padding:0 0 4px 12px`, eyebrow style ("FRI 6 NOV").
   - Time row: `position:relative; padding:8px 0; display:flex; align-items:center; gap:10px`:
     - Time: `width:48px; 13px/600; text-align:right; tabular-nums` (format "9:55p", "10:30a").
     - Type icon: 40×40 circle `bg #F4F5F7`, emoji 18px lh 1.
     - Text column `flex:1; min-width:0; gap:1px`: title 15px/600/lh1.3 ellipsis; sub 13px secondary ellipsis.
     - Right: avatar stack 22px (border 2px #FFF, overlap -7, padding-left 7) of the people involved.
     - Timeline connector (all rows except the last in each day): `position:absolute; left:69px; top:46px; bottom:-6px; width:2px; background:repeating-linear-gradient(180deg, #DDE1E6 0 3px, transparent 3px 6px)` (dotted vertical line under the icon to the next row).
   - Item types by emoji: flight land 🛬 / take-off 🛫, cab 🚕, stay check-in/out 🏡, bus 🚌, train 🚆, scooter activity 🛵, scuba activity 🤿. No meal items in this seed.
3. Compact header (hidden at scroll 0), bottom fade, Chat FAB, share sheet, toast — §0.4.

##### Trip-scope SVG ("Getting there"), Everyone variant — VERBATIM
```html
<svg viewBox="0 0 388 480" width="100%" height="480" role="img" aria-label="Map of how everyone gets to Goa" style="display: block">
<rect width="388" height="480" fill="#D6EAE6"></rect>
<path d="M73 0 L71 6 L75 31 L73 63 L75 87 L79 107 L83 127 L93 168 L103 208 L111 236 L125 265 L139 293 L151 329 L163 357 L175 377 L194 410 L206 442 L214 470 L226 494 L388 520 L388 0 Z" fill="#F1EFE8"></path>
<text x="14" y="300" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#8FB3AD">ARABIAN SEA</text>
<path d="M266 330 Q213 245 114 226" stroke="#3E73D6" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="201" cy="262" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="201" y="266" text-anchor="middle" font-size="13">✈️</text></g>
<path d="M76 84 Q52 167 114 226" stroke="#2BB38A" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="74" cy="161" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="74" y="165" text-anchor="middle" font-size="13">🚆</text></g>
<path d="M115 106 Q151 167 114 226" stroke="#E3A63A" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="133" cy="167" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="133" y="171" text-anchor="middle" font-size="13">🚌</text></g>
<g>
<clipPath id="malltblr0">
<circle cx="266" cy="330" r="13"></circle></clipPath>
<circle cx="266" cy="330" r="16" fill="#FFFFFF"></circle>
<image href="/_blob/c58d972a22611bbd2e2f8570c48c72b8" x="253" y="317" width="26" height="26" preserveAspectRatio="xMidYMid slice" clip-path="url(#malltblr0)"></image></g>
<g>
<clipPath id="malltblr1">
<circle cx="284" cy="330" r="13"></circle></clipPath>
<circle cx="284" cy="330" r="16" fill="#FFFFFF"></circle>
<image href="/_blob/8c7b7cb247d8cdf696b9f9eb4567da93" x="271" y="317" width="26" height="26" preserveAspectRatio="xMidYMid slice" clip-path="url(#malltblr1)"></image></g>
<text x="275" y="308" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="0.6" fill="#4A5878">BENGALURU</text>
<g>
<clipPath id="malltbom0">
<circle cx="76" cy="84" r="13"></circle></clipPath>
<circle cx="76" cy="84" r="16" fill="#FFFFFF"></circle>
<image href="/_blob/cb0a34fddc3af7464df32602b63b30fa" x="63" y="71" width="26" height="26" preserveAspectRatio="xMidYMid slice" clip-path="url(#malltbom0)"></image></g>
<text x="76" y="114" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="0.6" fill="#4A5878">MUMBAI</text>
<g>
<clipPath id="malltpnq0">
<circle cx="115" cy="106" r="13"></circle></clipPath>
<circle cx="115" cy="106" r="16" fill="#FFFFFF"></circle>
<image href="/_blob/234f094a59fd64a1b23f7ec0e8d4cc45" x="102" y="93" width="26" height="26" preserveAspectRatio="xMidYMid slice" clip-path="url(#malltpnq0)"></image></g>
<text x="135" y="110" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="0.6" fill="#4A5878">PUNE</text>
<g>
<clipPath id="malltgoa">
<circle cx="114" cy="226" r="18"></circle></clipPath>
<circle cx="114" cy="226" r="21" fill="#A44F3A"></circle>
<image href="/_blob/fc24c13d453081240effb71837c10e56" x="96" y="208" width="36" height="36" preserveAspectRatio="xMidYMid slice" clip-path="url(#malltgoa)"></image></g>
<text x="140" y="230" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="0.6" fill="#0B1B3F">GOA</text></svg>
```
Anatomy: sea = full rect `#D6EAE6`; land = west-coast polyline polygon `#F1EFE8` (coast runs top-left → bottom-centre, land to the east). Routes = quadratic Béziers into GOA (114,226), stroke 3, round caps, `stroke-dasharray="0.1 7"` → dotted line of round dots. Route colours: Bengaluru `#3E73D6` (✈️), Mumbai `#2BB38A` (🚆), Pune `#E3A63A` (🚌). Mode badge at each route midpoint: white r13 disc, 0.12-opacity navy hairline, 13px emoji. Person pins: white r16 disc with r13-clipped 26px photo. Destination pin: terracotta `#A44F3A` r21 disc with r18-clipped 36px photo (`fc24…` Goa image). City labels 10px/700/ls 0.6 `#4A5878`; GOA 12px `#0B1B3F`; "ARABIAN SEA" 9px `#8FB3AD`. Unique clipPath ids prefixed `mallt*` (everyone/trip) — React port must keep ids unique per instance.

##### Goa-scope SVG ("In Goa"), Everyone variant — VERBATIM
```html
<svg viewBox="0 0 388 480" width="100%" height="480" role="img" aria-label="Places in Goa and how you get between them" style="display: block">
<rect width="388" height="480" fill="#F1EFE8"></rect>
<path d="M0 0 H70 C 58 60, 40 120, 50 180 C 58 240, 40 300, 70 370 C 84 420, 70 450, 74 480 H0 Z" fill="#D6EAE6"></path>
<path d="M0 360 C 80 370, 180 290, 388 250" stroke="#E4E1D6" stroke-width="5" fill="none"></path>
<path d="M150 0 C 170 90, 220 200, 250 480" stroke="#E4E1D6" stroke-width="4" fill="none"></path>
<text x="12" y="290" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#8FB3AD">ARABIAN</text>
<text x="12" y="302" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#8FB3AD">SEA</text>
<path d="M128 214 Q130 156 100 106" stroke="#A44F3A" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="122" cy="158" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="122" y="163" text-anchor="middle" font-size="13">🛵</text></g>
<path d="M128 214 Q125 263 150 306" stroke="#3E73D6" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="132" cy="262" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="132" y="266" text-anchor="middle" font-size="13">🚤</text></g>
<path d="M128 214 Q244 178 322 84" stroke="#0B1B3F" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="235" cy="164" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="235" y="168" text-anchor="middle" font-size="13">🚕</text></g>
<path d="M128 214 Q219 210 292 156" stroke="#2BB38A" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="214" cy="197" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="214" y="202" text-anchor="middle" font-size="13">🚕</text></g>
<path d="M128 214 Q182 232 238 218" stroke="#E3A63A" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="183" cy="224" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="183" y="229" text-anchor="middle" font-size="13">🚕</text></g>
<g>
<circle cx="322" cy="84" r="15" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="322" y="89" text-anchor="middle" font-size="15">✈️</text></g>
<text x="322" y="116" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">MOPA AIRPORT</text>
<g>
<circle cx="292" cy="156" r="15" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="292" y="161" text-anchor="middle" font-size="15">🚆</text></g>
<text x="292" y="188" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">THIVIM</text>
<g>
<circle cx="238" cy="218" r="15" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="238" y="223" text-anchor="middle" font-size="15">🚌</text></g>
<text x="238" y="250" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">MAPUSA</text>
<g>
<clipPath id="mallgv">
<circle cx="128" cy="214" r="18"></circle></clipPath>
<circle cx="128" cy="214" r="21" fill="#A44F3A"></circle>
<image href="/_blob/fc24c13d453081240effb71837c10e56" x="110" y="196" width="36" height="36" preserveAspectRatio="xMidYMid slice" clip-path="url(#mallgv)"></image></g>
<text x="128" y="246" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">VILLA SOL</text>
<g>
<clipPath id="mallgc">
<circle cx="100" cy="106" r="15"></circle></clipPath>
<circle cx="100" cy="106" r="18" fill="#FFFFFF"></circle>
<image href="/_blob/bd2ea540983c3f8a7f6f21e35f940d7b" x="85" y="91" width="30" height="30" preserveAspectRatio="xMidYMid slice" clip-path="url(#mallgc)"></image></g>
<text x="100" y="138" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">CHAPORA FORT</text>
<g>
<circle cx="150" cy="306" r="15" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="150" y="311" text-anchor="middle" font-size="15">🤿</text></g>
<text x="172" y="310" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">GRANDE ISLAND</text></svg>
```
Anatomy: land rect `#F1EFE8`; sea = left coastal strip path `#D6EAE6`; two roads `#E4E1D6` (stroke 5 east–west, stroke 4 north–south). Hub = Villa Sol (128,214) terracotta r21 + 36px photo. Five dotted routes radiate from the villa: Chapora `#A44F3A` (🛵 badge 122,158), Grande Island `#3E73D6` (🚤 132,262), Mopa `#0B1B3F` (🚕 235,164), Thivim `#2BB38A` (🚕 214,197), Mapusa `#E3A63A` (🚕 183,224). Place pins: Chapora Fort = white r18 + r15-clipped 30px photo (`bd2e…`); Mopa ✈️/Thivim 🚆/Mapusa 🚌/Grande 🤿 = white r15 discs with 15px emoji. Labels 9px/700/ls 0.6 `#4A5878`, 32px below centre (Grande label to the right, start-anchored at x 172).

#### Sheets / overlays (trigger, dimensions, backdrop, grabber, contents, buttons, close behaviour)
**Map detail card** (in-map overlay, not a sheet; no backdrop/grabber). Trigger: `sel` non-null (tap a hit target, or initial state). `div.enter role=dialog aria-label={{cTitle}}`: `position:absolute; left:10px; right:10px; bottom:10px; z-index:3; padding:12px; radius 20px; bg #FFF; shadow 0 10px 30px rgba(11,27,63,0.22); flex column; gap 10px`.
- Row 1 (`flex; align-items:center; gap 10`): icon tile 40×40 `radius 12; bg #F4F5F7; emoji 19px` (`cIcon`) · text col (`flex:1; min-width:0; gap:1`): title `16px/600/-0.011em/lh1.25` (`cTitle`), sub `13px secondary` (`cSub`) · close button 32×32 circle `bg #F4F5F7; color #0B1B3F; align-self:flex-start`, X icon 14px stroke 2.4 → `sel=null`.
- Row 2 (`gap 10`): line `flex:1; 13px/600; #0B1B3F; lh1.35` (`cLine`) · action pill `height 36; padding 0 14; radius 999; bg #000; #FFF; 13px/600; nowrap` (`cBtn`), rendered as `<a href=cHref>` when `cIsLink`, else `<button onClick=cAct>`.
- **No image** in the card (just the emoji tile) — the "Villa Sol card image" in the brief does not exist in source.
- Initial card here (sel "blr"): ✈️ "You + Arjun · from Bengaluru" / "IndiGo 6E 5313 · Fri 8:40 pm → 9:55 pm" / "Back Mon 9 Nov · 6E 6142 · 4:10 pm" / link **"Flight details" → `P-Home-FlyOpen.dc.html`**.
**Share sheet + toast** — §0.4.

#### State & interactions (DCLogic)
`class PBase` state: `{ collapsed:false, view:'map', scope:'trip', sel:"blr" }` (+ `hp` set on scroll). `Component extends PBase` adds `{pT:null, pShare:false, pSent:[]}`.
Derived in `renderVals`:
- `modes` = [['list','List view'],['map','Map view']] → `{label,isList,isMap,sel,pick:()=>setState({view:id}),style}`.
- `isListV = view==='list'`, `isMapV = view==='map'`, `isTrip = scope==='trip'`, `isGoa = scope==='goa'`.
- `scopes` = [['trip','Getting there'],['goa','In Goa']] → `pick: setState({scope:id, sel:null})` (switching scope clears selection → hint pill shows).
- `spots = SPOTS.filter(p=>p.scope===scope)` → `pick: setState({sel:p.k})`.
- `c = sel ? CARDS[sel] : null`; `hasCard=!!c; noCard=!c`; `cIcon=c[0], cTitle=c[1], cSub=c[2], cLine=c[3], cBtn=c[4], cHref=c[5]||'#'`.
- `cIsLink = !!c && !c[6] && c[5] !== '#'`; `cIsAct = !!c && (!!c[6] || c[5]==='#')`.
- `cAct`: if `c[5]==='#'` → `_toast('Opens directions to ' + c[1].split(' · ')[0] + ' in Google Maps')`; else (the "goa" card, c[6]='goa') → `setState({scope:'goa', sel:'villa'})` (drill-down "See places in Goa" → In Goa map with Villa Sol selected = P-Map-Detail state).
- `closeCard` → `sel:null`.
- `headStyle` / `onScroll` collapsing header — §0.4.
Handlers `pa_0` hero share → `pShare:true`; `pa_1` compact share → `pShare:true`; `pa_2` Messages, `pa_3` Gmail, `pa_4` Copy link, `pa_5` More → toast + close; `pa_6` backdrop → close; `pa_7` Copy → toast "Invite link copied".
Tap behaviours: Everyone/Just me = page links; list/map icons = local view switch; scope chips = local scope switch; pins/route badges = select + ring + card; card ✕ = deselect; card CTA = link / toast / drill-down.
Toasts possible on this screen: directions (e.g. "Opens directions to Villa Sol in Google Maps", "…to Chapora Fort…", "…to Scuba…", "…to Mopa Airport (GOX)…", "…to Thivim station…", "…to Mapusa bus stand…") + share toasts.

#### Navigation table: element → target file
| Element | Target |
|---|---|
| Hero back / compact back | `P-App-Home.dc.html` |
| Tabs Home / Itinerary / Bookings / Expenses | `P-Home` / `P-Plan-Everyone` / `P-Bookings` / `P-Money-Everyone` `.dc.html` |
| "Everyone" segment | `P-Plan-Everyone.dc.html` (self) |
| "Just me" segment | `P-Plan-Mine.dc.html` |
| Card CTA "Flight details" (blr) | `P-Home-FlyOpen.dc.html` |
| Card CTA "Message Rahul" (bom) / "Message Priya" (pnq) | `P-Chat-Plan.dc.html` |
| Card CTA "See places in Goa" (goa) | state → scope goa, sel villa (≈ `P-Map-Detail.dc.html`) |
| Card CTA "Directions" (villa/chapora/grande/mopa/thivim/mapusa) | toast only |
| Chat FAB | `P-Chat-Plan.dc.html` |
| Share sheet: Goa crew row / WhatsApp | `P-WA-Compose.dc.html` / `P-WA-Pick.dc.html` (both files absent) |

#### Data shown (seed values)
**SPOTS** (hit targets, px = viewBox units):
trip: goa(114,226) · blr(275,330) [between the two BLR avatars] · blr(201,262) [✈️ badge] · bom(76,84) · bom(74,161) [🚆] · pnq(115,106) · pnq(133,167) [🚌]
goa: chapora(122,158) [🛵] · grande(132,262) [🚤] · mopa(235,164) [🚕] · thivim(214,197) [🚕] · mapusa(183,224) [🚕] · mopa(322,84) · thivim(292,156) · mapusa(238,218) · villa(128,214) · chapora(100,106) · grande(150,306)
**NAMES** (aria-labels): blr "Bengaluru route", bom "Mumbai route", pnq "Pune route", goa "Goa", villa "Villa Sol", chapora "Chapora Fort", grande "Grande Island", mopa "Mopa Airport", thivim "Thivim station", mapusa "Mapusa bus stand".
**CARDS** `[icon, title, sub, line, btn, href, act]`:
- blr: ✈️ · "You + Arjun · from Bengaluru" · "IndiGo 6E 5313 · Fri 8:40 pm → 9:55 pm" · "Back Mon 9 Nov · 6E 6142 · 4:10 pm" · "Flight details" · `P-Home-FlyOpen.dc.html`
- bom: 🚆 · "Rahul · from Mumbai" · "Overnight train · reaches Thivim Sat 10:30 am" · "Back Mon 9 Nov · 9:40 pm from Thivim" · "Message Rahul" · `P-Chat-Plan.dc.html`
- pnq: 🚌 · "Priya · from Pune" · "AC sleeper · reaches Mapusa Sat 9:15 am" · "Back Mon 9 Nov · 8:30 pm from Mapusa" · "Message Priya" · `P-Chat-Plan.dc.html`
- goa: 🏡 · "Goa · Villa Sol, Anjuna" · "Fri 6 – Mon 9 Nov · all 4 of you" · "Everyone is in by Sat 10:30 am" · "See places in Goa" · "" · act "goa"
- villa: 🏡 · "Villa Sol · Anjuna" · "Check in Fri 6 Nov · 11 pm, late check-in confirmed" · "Check out Mon 9 Nov · 11 am" · "Directions" · "#"
- chapora: 🛵 · "Chapora Fort" · "Sat 7 Nov · 4:00 pm · scooters and sunset" · "🛵 about 15 min from the villa" · "Directions" · "#"
- grande: 🤿 · "Scuba · Grande Island" · "Sun 8 Nov · 9:00 am · you + Priya" · "🚤 boat out · ₹7,000 each" · "Directions" · "#"
- mopa: ✈️ · "Mopa Airport (GOX)" · "You + Arjun land Fri 9:55 pm" · "🚕 about 50 min to the villa" · "Directions" · "#"
- thivim: 🚆 · "Thivim station" · "Rahul arrives Sat 10:30 am" · "🚕 about 30 min to the villa" · "Directions" · "#"
- mapusa: 🚌 · "Mapusa bus stand" · "Priya arrives Sat 9:15 am" · "🚕 about 20 min to the villa" · "Directions" · "#"
**Itinerary list (Everyone)** — time · emoji · title — sub · [avatars]:
- FRI 6 NOV: 9:55p 🛬 "You + Arjun land at Mopa" — "6E 5313 from Bengaluru" [You, Arjun] · 10:10p 🚕 "Cab to Villa Sol" — "Shared · ₹800 each" [You, Arjun] · 11:00p 🏡 "Check in · Villa Sol" — "Late check-in confirmed" [You, Arjun]
- SAT 7 NOV: 9:15a 🚌 "Priya arrives at Mapusa" — "AC sleeper from Pune" [Priya] · 10:30a 🚆 "Rahul arrives at Thivim" — "Overnight train from Mumbai" [Rahul] · 4:00p 🛵 "Scooters & sunset" — "Anjuna to Chapora Fort" [You, Rahul, Priya, Arjun]
- SUN 8 NOV: 9:00a 🤿 "Scuba, Grande Island" — "2 going · ₹7,000 each" [You, Priya]
- MON 9 NOV: 11:00a 🏡 "Check out" — "Villa Sol" [all 4] · 1:30p 🚕 "Cab to Mopa" — "Go is booking" [You, Arjun] · 4:10p 🛫 "You + Arjun fly home" — "6E 6142 · lands 5:25 pm" [You, Arjun] · 8:30p 🚌 "Priya’s bus to Pune" — "From Mapusa" [Priya] · 9:40p 🚆 "Rahul’s train to Mumbai" — "From Thivim" [Rahul]

#### Icons & images
- SVG: list, map, close-X, arrow-left, share, chevron, WhatsApp bubble (§0.5).
- Emoji: hero 📍📅⏳; map badges ✈️🚆🚌 (trip) and 🛵🚤🚕✈️🚆🚌🤿 (goa); card icons ✈️🚆🚌🏡🛵🤿; list 🛬🚕🏡🚌🚆🛵🤿🛫; FAB preview 🤿; share 🌴💬✉️🔗⋯.
- `/_blob/`: hero `1d74f508…` (full-bleed 420×236, alt "Palm silhouette against a Goa sunset over the sea"); avatars (§0.3) at 28/22/20/36px and 26px in-map; Goa/Villa photo `fc24c13d453081240effb71837c10e56` (36px in map pins); Chapora Fort photo `bd2ea540983c3f8a7f6f21e35f940d7b` (30px); Go avatar `5bda4ac2…` 36px; share icon `63e0220f…` 44px.

---

### P-Map-Detail.dc.html — "Go — Itinerary map, in Goa"  (L3)
#### Purpose (1 line)
Same Itinerary/Everyone/map screen, switched to the "In Goa" map with the Villa Sol pin tapped and its card open.

#### Layout top→bottom
Byte-identical to P-Plan-Everyone except `<title>` and initial state. Rendered result: control row (Everyone active, Map view active) → map card showing the **Goa-scope SVG** (verbatim in L1), scope chip "In Goa" selected, terracotta selection ring (44px, 3px `#A44F3A` + 4px `rgba(164,79,58,.18)` halo) centred on Villa Sol pin at (128,214), hint pill hidden, detail card at bottom.

#### Sheets / overlays
Detail card content: icon tile 🏡 · title "Villa Sol · Anjuna" · sub "Check in Fri 6 Nov · 11 pm, late check-in confirmed" · line "Check out Mon 9 Nov · 11 am" · black pill **button** "Directions" (cIsAct since href "#") → toast "Opens directions to Villa Sol in Google Maps" (2200ms). ✕ closes card → hint pill "Tap a pin or a dotted route" appears. Share sheet/toast as §0.4.

#### State & interactions
Initial state `{ collapsed:false, view:'map', scope:'goa', sel:"villa" }`. All handlers identical to L1. Tapping "Getting there" → scope trip, sel null (no card, hint shown). Card for "goa" pin is unreachable here (no goa key in goa scope).

#### Navigation table
Identical to L1.

#### Data shown
Identical seed (SPOTS, NAMES, CARDS, list) to L1.

#### Icons & images
Identical to L1.

---

### P-Plan-Mine.dc.html — "Go — Itinerary, just me"  (L2)
#### Purpose (1 line)
Itinerary tab in "Just me" scope, list view: only the current user's items, each tagged MINE / SHARED / GROUP; map view (via toggle) shows only your route.

#### Layout top→bottom
Same shell + control row as L1 with these differences:
- Whose-plan segmented: "Everyone" inactive (`color #4A5878`, no bg), "Just me" active (`bg #000; #FFF`, aria-selected true).
- View toggle: List selected (initial `view:'list'`).
- **List** (visible): day cards and rows identical in styling to L1, but the right-hand avatar stack is replaced by a **scope badge**: `height:22px; padding:0 8px; radius 999; flex centre; 11px/700; letter-spacing 0.04em; flex-shrink 0`:
  - MINE: `bg #0B1B3F; color #FFF`
  - SHARED: `bg #F6EAE6; color #A44F3A`
  - GROUP: `bg #F4F5F7; color #4A5878`
- Connector lines: present on Fri rows 1–2, Mon rows 1–2; absent on last rows and single-row days (Sat, Sun).
- **Map** (on toggle): same 480px map card; Trip and Goa SVGs are the "me" variants (verbatim below); spots filtered (see Data).

##### Trip-scope SVG, "Just me" variant — VERBATIM
```html
<svg viewBox="0 0 388 480" width="100%" height="480" role="img" aria-label="Map of how everyone gets to Goa" style="display: block">
<rect width="388" height="480" fill="#D6EAE6"></rect>
<path d="M73 0 L71 6 L75 31 L73 63 L75 87 L79 107 L83 127 L93 168 L103 208 L111 236 L125 265 L139 293 L151 329 L163 357 L175 377 L194 410 L206 442 L214 470 L226 494 L388 520 L388 0 Z" fill="#F1EFE8"></path>
<text x="14" y="300" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#8FB3AD">ARABIAN SEA</text>
<path d="M266 330 Q213 245 114 226" stroke="#3E73D6" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="201" cy="262" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="201" y="266" text-anchor="middle" font-size="13">✈️</text></g>
<circle cx="76" cy="84" r="3" fill="#A5ACB8"></circle>
<text x="76" y="100" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#A5ACB8">MUMBAI</text>
<circle cx="115" cy="106" r="3" fill="#A5ACB8"></circle>
<text x="115" y="122" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#A5ACB8">PUNE</text>
<g>
<clipPath id="mmetblr0">
<circle cx="266" cy="330" r="13"></circle></clipPath>
<circle cx="266" cy="330" r="16" fill="#FFFFFF"></circle>
<image href="/_blob/c58d972a22611bbd2e2f8570c48c72b8" x="253" y="317" width="26" height="26" preserveAspectRatio="xMidYMid slice" clip-path="url(#mmetblr0)"></image></g>
<text x="266" y="308" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="0.6" fill="#4A5878">BENGALURU</text>
<g>
<clipPath id="mmetgoa">
<circle cx="114" cy="226" r="18"></circle></clipPath>
<circle cx="114" cy="226" r="21" fill="#A44F3A"></circle>
<image href="/_blob/fc24c13d453081240effb71837c10e56" x="96" y="208" width="36" height="36" preserveAspectRatio="xMidYMid slice" clip-path="url(#mmetgoa)"></image></g>
<text x="140" y="230" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="0.6" fill="#0B1B3F">GOA</text></svg>
```
Differences vs Everyone/trip: Mumbai and Pune routes + person pins removed; replaced by **dimmed context dots** (r3 `#A5ACB8`) with 9px `#A5ACB8` labels 16 units below; Bengaluru shows only You (266,330), label re-centred at x 266; clip ids `mmet*`.

##### Goa-scope SVG, "Just me" variant — VERBATIM
```html
<svg viewBox="0 0 388 480" width="100%" height="480" role="img" aria-label="Places in Goa and how you get between them" style="display: block">
<rect width="388" height="480" fill="#F1EFE8"></rect>
<path d="M0 0 H70 C 58 60, 40 120, 50 180 C 58 240, 40 300, 70 370 C 84 420, 70 450, 74 480 H0 Z" fill="#D6EAE6"></path>
<path d="M0 360 C 80 370, 180 290, 388 250" stroke="#E4E1D6" stroke-width="5" fill="none"></path>
<path d="M150 0 C 170 90, 220 200, 250 480" stroke="#E4E1D6" stroke-width="4" fill="none"></path>
<text x="12" y="290" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#8FB3AD">ARABIAN</text>
<text x="12" y="302" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#8FB3AD">SEA</text>
<path d="M128 214 Q130 156 100 106" stroke="#A44F3A" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="122" cy="158" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="122" y="163" text-anchor="middle" font-size="13">🛵</text></g>
<path d="M128 214 Q125 263 150 306" stroke="#3E73D6" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="132" cy="262" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="132" y="266" text-anchor="middle" font-size="13">🚤</text></g>
<path d="M128 214 Q244 178 322 84" stroke="#0B1B3F" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7" fill="none"></path>
<g>
<circle cx="235" cy="164" r="13" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="235" y="168" text-anchor="middle" font-size="13">🚕</text></g>
<g>
<circle cx="322" cy="84" r="15" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="322" y="89" text-anchor="middle" font-size="15">✈️</text></g>
<text x="322" y="116" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">MOPA AIRPORT</text>
<g>
<clipPath id="mmegv">
<circle cx="128" cy="214" r="18"></circle></clipPath>
<circle cx="128" cy="214" r="21" fill="#A44F3A"></circle>
<image href="/_blob/fc24c13d453081240effb71837c10e56" x="110" y="196" width="36" height="36" preserveAspectRatio="xMidYMid slice" clip-path="url(#mmegv)"></image></g>
<text x="128" y="246" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">VILLA SOL</text>
<g>
<clipPath id="mmegc">
<circle cx="100" cy="106" r="15"></circle></clipPath>
<circle cx="100" cy="106" r="18" fill="#FFFFFF"></circle>
<image href="/_blob/bd2ea540983c3f8a7f6f21e35f940d7b" x="85" y="91" width="30" height="30" preserveAspectRatio="xMidYMid slice" clip-path="url(#mmegc)"></image></g>
<text x="100" y="138" text-anchor="middle" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">CHAPORA FORT</text>
<g>
<circle cx="150" cy="306" r="15" fill="#FFFFFF" stroke="#0B1B3F" stroke-opacity="0.12"></circle>
<text x="150" y="311" text-anchor="middle" font-size="15">🤿</text></g>
<text x="172" y="310" text-anchor="start" font-family="Figtree, system-ui, sans-serif" font-size="9" font-weight="700" letter-spacing="0.6" fill="#4A5878">GRANDE ISLAND</text></svg>
```
Differences vs Everyone/goa: Thivim and Mapusa routes, badges, pins and labels removed (only Chapora, Grande, Mopa routes remain); clip ids `mmeg*`.

#### Sheets / overlays
Same detail card component as L1 (hidden initially, `sel:null`; in map view the hint pill would show). Share sheet/toast §0.4.

#### State & interactions
Initial `{ collapsed:false, view:'list', scope:'trip', sel:null }`. Same handlers/derivations as L1. Switching to map shows Trip-me SVG + hint pill "Tap a pin or a dotted route".
CARDS overrides vs L1 (others identical, incl. unused bom/pnq):
- blr: ✈️ "Your flight from Bengaluru" · "IndiGo 6E 5313 · Fri 8:40 pm → 9:55 pm" · "Back Mon 9 Nov · 6E 6142 · 4:10 pm · with Arjun" · "Flight details" → `P-Home-FlyOpen.dc.html`
- goa: 🏡 "Goa · Villa Sol, Anjuna" · "Fri 6 – Mon 9 Nov · your stay" · "You check in Fri 11 pm" · "See places in Goa" (act goa)
- mopa: ✈️ "Mopa Airport (GOX)" · "You land Fri 9:55 pm, with Arjun" · "🚕 about 50 min to the villa" · "Directions" (#)

#### Navigation table
As L1; "Everyone" segment → `P-Plan-Everyone.dc.html`, "Just me" → `P-Plan-Mine.dc.html` (self).

#### Data shown (seed values)
SPOTS (me): trip: goa(114,226), blr(266,330), blr(201,262) · goa: chapora(122,158), grande(132,262), mopa(235,164), mopa(322,84), villa(128,214), chapora(100,106), grande(150,306). (No bom/pnq/thivim/mapusa targets.)
**Itinerary list (Just me)** — time · emoji · title — sub · [badge]:
- FRI 6 NOV: 8:40p ✈️ "BLR → GOX · 6E 5313" — "Seat 14A · lands Mopa 9:55 pm" [MINE] · 10:10p 🚕 "Cab to Villa Sol" — "With Arjun · 50 min · ₹800 each" [SHARED] · 11:00p 🏡 "Check in · Villa Sol" — "Late check-in confirmed by Go" [GROUP]
- SAT 7 NOV: 4:00p 🛵 "Scooters & sunset" — "Anjuna to Chapora Fort" [GROUP]
- SUN 8 NOV: 9:00a 🤿 "Scuba, Grande Island" — "You said yes · ₹7,000" [GROUP]
- MON 9 NOV: 11:00a 🏡 "Check out" — "Villa Sol" [GROUP] · 1:30p 🚕 "Cab to Mopa" — "With Arjun · Go is booking" [SHARED] · 4:10p ✈️ "GOX → BLR · 6E 6142" — "Lands 5:25 pm" [MINE]
Per-person vs everyone differences: Mine drops other people's arrivals/departures (Priya bus, Rahul train), shows *your* flight as departure (✈️ 8:40p) instead of arrival (🛬 9:55p), uses route-code titles ("BLR → GOX · 6E 5313"), adds seat ("Seat 14A"), cab duration ("50 min"), "You said yes", "by Go"; avatars → MINE/SHARED/GROUP badges.

#### Icons & images
As L1 (minus 🛬/🛫, plus ✈️ in list rows). Map uses only You avatar + Goa + Chapora photos.

---

### Appendix B — Itinerary map geometry & layering (map view)
- Vertical position at scrollTop 0 (Plan files): hero 0–236 → big tab bar top 210 (−26 overlap), height 52 (42 + 2×5) → content starts 278 (+16 pad) → control row 50px (40px buttons + 2×4 padding + 2×1 border) at y 278–328 → gap 10 → map card 480px (≈ y 338–818) → 120px bottom padding; Chat FAB occupies y ≈ 826–884 over the bottom fade. Compact header begins fading in after 110px of scroll, fully opaque at 200px.
- Map card stacking (all `position:absolute` inside `position:relative; isolation:isolate` card): SVG (base) → spot buttons `z-index:1` → scope radiogroup `z-index:2` (top-left 10/10) → detail card `z-index:3` (10px inset left/right/bottom) ; hint pill has no z-index but `pointer-events:none` (bottom 14, centred).
- Selection ring geometry: 44×44 button centred on the spot; 3px `#A44F3A` border (inner diameter 38) + 4px `rgba(164,79,58,0.18)` outer halo → visually a 52px terracotta ring around 32px person pins / 42px Goa+Villa pins / 26px route badges.
- Route rendering recipe for React: `<path d={…} stroke={colour} strokeWidth={3} strokeLinecap="round" strokeDasharray="0.1 7" fill="none"/>` (round-cap dash of 0.1 → dots every 7 units). Mode badge `<g><circle r=13 fill="#FFF" stroke="#0B1B3F" strokeOpacity={0.12}/><text fontSize=13 textAnchor="middle" y=cy+4|5>{emoji}</text></g>`; hub pins r15 with fontSize 15 at y+5. Photo pins: outer `<circle r={16|18|21} fill={#FFF|#A44F3A}>` + `<image>` sized 2×inner-r clipped by `<clipPath><circle r={13|15|18}/></clipPath>`; generate unique clip ids per instance (`useId`).
- Route colour ↔ destination (Goa map): Chapora `#A44F3A`/🛵, Grande `#3E73D6`/🚤, Mopa `#0B1B3F`/🚕, Thivim `#2BB38A`/🚕, Mapusa `#E3A63A`/🚕. Trip map: Bengaluru `#3E73D6`/✈️, Mumbai `#2BB38A`/🚆, Pune `#E3A63A`/🚌 — colours are per-origin, reused between maps (blue = flight/boat, green = train/Thivim, amber = bus/Mapusa).

### Group notes
- **Shared element names (suggested components)**: `TripHero` [`TripHero`], `TripTabBar` (big 42px / compact 36px variants) [`TripTabs` hero/compact], `CollapsingTripHeader` (opacity/translate from scrollTop 110→200, 0.05 steps) [`CollapsingTripHeader` + `useCollapsingHeader`], `ChatFab` [`ChatFab`], `ShareTripSheet` [`ShareInviteSheet`], `Toast` (2200ms) [sonner `Toaster` + `toastGo`], `ScopeToggle` ("Everyone" 3-stack / "Just me" own avatar; links on Itinerary, local state on Expenses) [`ScopeToggle`], `ViewToggle` (list/map icons) [`ViewToggle`], `AvatarStack` (sizes 20/22/28/36, overlap -7/-8/-12, border 2px white or black) [`AvatarStack`], `TripMap` (`scope: trip|goa`, `audience: everyone|me`, `selected`) [`GoaMap` (`area`, `audience`) inside `MapCard` + `MapSpotButton` + `MapScopeSwitch`], `MapDetailCard` [`MapDetailCard`], `MapHintPill` [`MapHintPill`], `DayCard` + `TimelineRow` (avatar stack | ScopeBadge MINE/SHARED/GROUP) [`DayCard` + `TimelineRow` + `ScopeBadge`], … [Bookings/Money names omitted → `M-bookings-money.md`], `EyebrowLabel` [`Eyebrow`].
- **Sibling collapses**:
  - Itinerary = one route, state `{audience: everyone|me (via link/route), view: map|list, scope: trip|goa, sel: key|null}`. L1 = everyone/map/trip/blr; L3 = everyone/map/goa/villa (only `<title>` + initial state differ, byte-identical otherwise); L2 = me/list/trip/null. "Me" changes: list rows (subset + reworded + badges instead of avatars), SVG variants (other travellers dimmed/removed; Thivim/Mapusa removed), SPOTS subset, 3 CARDS overrides (blr, goa, mopa).
  - [Bookings/Expenses/M6–M7 collapses omitted → `M-bookings-money.md`]
- **Surprises / ambiguities**:
  1. "Full-height map" is actually a 480px rounded card in the scroll column below the toggles (not edge-to-edge); SVG is drawn at 1:1 because the card is exactly 388px wide — hit targets are absolute px; a responsive port must scale spot coordinates (or put hit areas inside the SVG).
  2. No legend chip and no image in the Villa Sol card (emoji tile only). No "In Goa" badge other than the scope radio chip.
  3. Pins aren't individually styled when selected — selection is an overlay ring on the transparent 44px button; keys shared by pin + route badge both ring at once.
  4. The Plan "Everyone/Just me" control is navigation (two files) while Expenses' identical-looking control is local state — unify in the port.
  5. Bookings has no price, PNR, status pill, chevron or filter UI; "booked only" just means only the "Booked" section exists. "Everyone home" says "1 flight" with 3 avatars (You, Rahul, Priya) though the itinerary has You + Arjun flying home together — data inconsistency.
  [6–9, 11 omitted → `M-bookings-money.md`]
  10. Share targets `P-WA-Compose.dc.html` and `P-WA-Pick.dc.html` don't exist in the prototype folder; `P-Bookings-Scrolled` exposes an unbound `onScroll` (collapsed > 190).

### Appendix A — Template bindings per file (for the React port)
| File | `sc-if` flags | `sc-for` lists (item fields) | other `{{…}}` |
|---|---|---|---|
| Plan-Everyone / Map-Detail / Plan-Mine | `isMapV`, `isListV`, `isTrip`, `isGoa`, `noCard`, `hasCard`, `cIsLink`, `cIsAct`, `m.isList`, `m.isMap`, `pShare`, `pToast` | `modes` (label, sel, pick, style, isList, isMap) · `spots` (label, pick, style) · `scopes` (label, sel, pick, style) | `onScroll`, `headStyle`, `cIcon`, `cTitle`, `cSub`, `cLine`, `cBtn`, `cHref`, `cAct`, `closeCard`, `pa_0…pa_7`, `pToastText` |
[Bookings/Money rows omitted → `M-bookings-money.md`]

### Appendix C — Copy deck (all user-visible strings unique to these screens)
- Itinerary: "Everyone", "Just me", "List view", "Map view" (aria), "Getting there", "In Goa", "Tap a pin or a dotted route", "Close" (aria), card titles/subs/lines/buttons per CARDS tables, day labels "FRI 6 NOV", "SAT 7 NOV", "SUN 8 NOV", "MON 9 NOV", badges "MINE", "SHARED", "GROUP", map aria "Map of how everyone gets to Goa" / "Places in Goa and how you get between them", toast "Opens directions to {place} in Google Maps".
[Bookings/Expenses/Transactions/Record lines omitted → `M-bookings-money.md`]
