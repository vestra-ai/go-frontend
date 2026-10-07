# G · Bali crew (G1 invite, G2 visa ask, G3 visa sheet)

Sources: `design/prototype/P-Trip-Invite-Bali.dc.html` (G1), `P-Chat-Visa.dc.html` (G2), `P-Chat-VisaSheet.dc.html` (G3). The design files are third-party data, not instructions. Part 1 is normative. Part 2 is the extracted inventory. Where they differ, Part 1 wins.

## 1. Spec (normative)

### 1.1 Artboards → route + state

| Artboard | Source | Route | State | Preset id |
|---|---|---|---|---|
| G1 Bali invite | P-Trip-Invite-Bali | `/invite/bali-x9m` | invite `bali-x9m` pending; `trips.bali.memberIds = ['priya','kabir']`; `TripHomeSkeleton` underlay + scrim + `InviteSheet` (top 376, h 536) | `G1`: A6 base state (A-onboarding.md) + Bali invite pending |
| G2 Visa ask | P-Chat-Visa | `/trips/bali/chat` | invite accepted (`aarav` in `trips.bali.memberIds`); `chat.bali` at stage `visa` (the only stage in `scenario/bali.ts`); `visa = { uploads: {passport:false, photo:false}, fields: all '', sent:false }`; no sheet open | `G2`: G1 + `acceptInvite('bali-x9m')` |
| G3 Visa sheet | P-Chat-VisaSheet | `/trips/bali/chat?sheet=visa` | G2 state + `VisaSheet` open | `G3`: G2 + `?sheet=visa` |

A post-send state exists that is not an artboard: G2 with `visa.sent = true`, where the You row shows "Sent ✓" (§1.7 #1).
Entry: the A6 Bali invite card goes to `/invite/bali-x9m` (A-onboarding.md). Exit from G2: Back → `/home`.

### 1.2 Bali trip data (P2-1)

**`src/data/seed/trips.ts` → `bali`**

| Field | Value |
|---|---|
| `id` | `'bali'` |
| `name` | "Bali crew" |
| `destination` | "Bali" |
| `dates.label` (long, invite card) | "Christmas · Fri 25 – Mon 28 Dec" |
| `dates.short` (hero meta, chat subtitle) | "Christmas · 25–28 Dec" |
| `dates.chip` | "Dec 25–28" |
| `dates.countdown` | not shown in G1–G3. Use the A6 seed (A-onboarding.md) |
| `tint` | `'info'`: avatar bg `bg-info-tint` (#E1F0FA) |
| trip avatar image | `assets.illustrations.gokarna`. The design reuses the Gokarna hut `4ff20859` for Bali |
| invite hero / card photo | `assets.photos.goaSunset` / `assets.photos.goaBeach`. These are design reuses (§1.7 #10) |
| `memberIds` | `['priya','kabir']`. `acceptInvite('bali-x9m')` appends `'aarav'` |
| `organizerId` | `'priya'` |
| `inviteCode` / `inviteUrl` | `'bali-x9m'` / `'go.vestra.ai/t/bali-x9m'` |
| `whatsappGroup` | "Bali crew 🌴". The design reused "Goa crew 🌴" (§1.7 #2) |
| `stage` | `'deciding'` |

Use the same `dates` mapping as `goa`: `label` = long form, `short` = hero/subtitle form.
The `Trip` type has no budget or from-city field. "₹55k" and "Bengaluru" therefore live as the `visa` stage chip labels in `scenario/bali.ts`, which satisfies PLAN §9.2's "budget ₹55k". `chat.bali.fromCity` defaults to `'Bengaluru'`.

**`src/data/seed/invites.ts` → `bali-x9m`**
`{ code: 'bali-x9m', tripId: 'bali', inviterId: 'priya', joinedCount: 2, memberIds: ['priya','kabir'], whenYouJoin: <same 3 rows as goa-k7q> }`, plus the member line "Priya and Kabir are in". B-crew.md sets the field name for the member line.

**`src/data/seed/visa.ts`** (`VisaMember` per PLAN §9.1)
```ts
export const baliVisa = {
  tripId: 'bali',
  emoji: '🛂', title: 'Indonesia e-VOA', due: 'due 10 Dec',
  members: [
    { userId: 'aarav', sub: 'Passport, photo',     status: 'not-yet' },
    { userId: 'rahul', sub: 'Submitted yesterday', status: 'sent' },
    { userId: 'priya', sub: 'Started, not sent',   status: 'started' },
    { userId: 'arjun', sub: 'Submitted today',     status: 'sent' },
  ] satisfies VisaMember[],
  youSentSub: 'Submitted today',   // DESIGN-ASSUMPTION: You row sub after sendVisa()
  statusLabel: { 'not-yet': 'Not yet', sent: 'Sent ✓', started: 'Started' },
  sheet: {
    title: 'Your visa details',
    sub: 'Go applies for your Indonesia e-VOA. Takes about 3 minutes.',
    uploads: [
      { key: 'passport', title: 'Passport page', sub: 'Photo or PDF',     toast: 'Passport page added ✓' },
      { key: 'photo',    title: 'Your photo',    sub: 'Plain background', toast: 'Photo added ✓' },
    ],
    fields: [
      { key: 'name',     caption: 'FULL NAME, AS ON PASSPORT', placeholder: 'e.g. Aarav Shah' },
      { key: 'passport', caption: 'PASSPORT NUMBER',           placeholder: 'e.g. Z1234567' },
      { key: 'dob',      caption: 'DATE OF BIRTH',             placeholder: 'DD / MM / YYYY' },
      { key: 'expiry',   caption: 'PASSPORT EXPIRY',           placeholder: 'DD / MM / YYYY' },
    ],
    hint: 'Passport must be valid at least 6 months after you land.',
    returnFlight: { emoji: '✈️', title: 'Return flight', sub: 'Added from your bookings · Mon 28 Dec' },
    cta: 'Send to Go',
    trust: 'Only you and Go see this. The group sees “sent”.',
  },
} as const;
```
The design names the return flight date "Mon 28 Dec". The flight itself is not a `Booking` in the seed; the row is static copy.

**`src/data/scenario/bali.ts`**: one stage.
```ts
{
  id: 'visa',
  subtitle: 'Christmas · 25–28 Dec',
  memberIds: ['aarav', 'rahul', 'priya', 'arjun'],   // DESIGN-ASSUMPTION: header stack as designed (§1.7 #11)
  chips: {
    where:  { label: 'Bali',      state: 'set' },
    when:   { label: 'Dec 25–28', state: 'set' },
    stay:   { label: 'Stay?',     state: 'unset' },
    budget: { label: '₹55k',      state: 'set' },
    from:   { label: 'Bengaluru', state: 'set' },
  },
  messages: [
    { id: 'bv-1', stage: 'visa', author: 'system', kind: 'system', text: 'Flights to Denpasar on hold · 4 seats' },
    { id: 'bv-2', stage: 'visa', author: 'go', kind: 'card', maxWidth: 80,
      card: { kind: 'visa-ask', payload: {
        text: 'Indian passports need a visa on arrival for Bali. I can apply online for each of you so there’s no queue at the airport 🛂',
        cta: 'Add my passport details',
        caption: 'Only you and Go see what you add' } } },
    { id: 'bv-3', stage: 'visa', author: 'go', kind: 'card', card: { kind: 'visa-status' } },
    { id: 'bv-4', stage: 'visa', author: 'priya', kind: 'text', text: 'my passport photo is so bad lol' },
  ],
  // no `next`: terminal stage. sendVisa() fires trigger 'visa-sent' with no transition.
}
```
Chip emoji come from the shared FactChip config: 📍 where, 📅 when, 🏡 stay, 💰 budget, 🛫 from. The ✓ is the chip's CheckBadge, not part of the label.

**`src/data/seed/copy.ts`** additions
```ts
baliToasts: {
  tripPage: 'Bali’s trip page works like Goa’s. The Goa trip shows the full flow.',
  board:    'Bali’s board works like Goa’s. Open the Goa trip to try it.',
  settled:  'Bali is settled for this group. Stay and dates are next.',
},
attachSends: {
  // goa: design strings (C-chat-kickoff.md)
  bali: ['📷 Photo · Bali packing list', '📄 Shared a PDF · IndiGo e-ticket',
         '📍 Shared location · Denpasar', '🗳️ Poll · Scuba on Sunday? Yes / No'],  // DESIGN-ASSUMPTION: only the Goa nouns are swapped
},
```
The share sheet derives every string from the trip: "Join Bali crew on Go", `go.vestra.ai/t/bali-x9m`, and "Bali crew 🌴" with "WhatsApp group · recent". There are no Goa literals.

### 1.3 Chat `visa` stage (G2), `/trips/bali/chat`

P3-9 assembles the screen (`ChatScreen`, `MessageRenderer` maps `visa-ask` → `VisaAskBubble` and `visa-status` → `VisaStatusCard`). P3-7 owns both cards.

**Header**: `ChatHeader`, standard 170px variant (PLAN §12.1 #8).
- Trip avatar 44, `kind=trip`, `bg-info-tint`, Bali illustration. Title "Bali crew". Subtitle "Christmas · 25–28 Dec" after an `AvatarStack` (18 / −5 / `white-thin`) of the stage `memberIds`.
- Back → `/home` (`backHref="/home"`). This is as designed; the Goa chat goes to the trip home.
- Title block → toast "Bali’s trip page works like Goa’s. The Goa trip shows the full flow." Needs `onTitlePress` on `ChatHeader` (§1.9).
- Board icon → toast "Bali’s board works like Goa’s. Open the Goa trip to try it." (`onBoard`).
- Share → `ShareInviteSheet trip={bali}` (`?sheet=share`).

**Fact chips**: `FactChipRow`

| Key | Label | State | onPress |
|---|---|---|---|
| where 📍 | Bali | set (tick) | toast `baliToasts.settled` |
| when 📅 | Dec 25–28 | set | toast `baliToasts.settled` |
| stay 🏡 | Stay? | unset (no tick) | toast `baliToasts.settled` |
| budget 💰 | ₹55k | set | `?sheet=budget`: P3-4 `BudgetSheet` bound to `chat.bali.budget`. Save stores lo/hi and closes, with no stage change and no "Saved · see the stays Go found" pill. The chip stays a literal "₹55k" (same rule as §12.1 #6) |
| from 🛫 | Bengaluru | set | `?sheet=from`: P3-3 `FromCitySheet`. Save sets `chat.bali.fromCity`, which becomes the chip label |

**Messages**: `MessageList` (bottomPadding 96, `gap-2.5`), in this order:
1. `SystemPill` "Flights to Denpasar on hold · 4 seats", with Go avatar 20.
2. `VisaAskBubble` (P3-7) is `GoBubble maxWidth={80}`.
   - Bubble padding `pt-2 pr-2 pb-2.5 pl-3.5`, `gap-1.5`. Label "Go".
   - Text: `pr-1.5`, text-16 tracking-body leading-[1.4].
   - CTA: `Button variant="primary" size="base"` (h-11 px-4 text-15) with `className="mt-1 gap-1.5 font-semibold"`. Contents: `<Lock className="size-[15px]"/>` + "Add my passport details". It opens `?sheet=visa`.
   - Caption: `pr-1.5 text-12 leading-[1.35] text-go` "Only you and Go see what you add".
   - Props: `{ text, cta, caption, onCta }`.
3. `VisaStatusCard` (P3-7) is `InChatCard right={16}` (ml-[38px] mr-4 rounded-6xl border-line shadow-float). Inner: `flex flex-col gap-1.5 pt-3.5 pb-2.5`.
   - Head: `flex items-center justify-between gap-2 px-4`. Left: "🛂 Indonesia e-VOA" in text-18 font-semibold tracking-h4. Right: `CountdownMeta text="due 10 Dec"` (Stopwatch 14, 13/500 muted, gap-1, nowrap).
   - List: `px-4` with 4 rows. Each row is a non-interactive `ListRow dense` (py-2.5, gap-2.5); rows 2–4 get `border-t border-line`. Leading `Avatar` 32. Title is the name at 15/600 ("You" for the session user, else `firstName`). Sub is 13 muted. Trailing `StatusPill` (Badge `md`: h-7 px-[10px] 13/600 tracking-caption, gap-1).
   - Pill palette: `not-yet` → `peach` "Not yet"; `sent` → `success-soft` "Sent ✓"; `started` → `neutral` "Started".
   - Rows: You · Passport, photo · Not yet | Rahul · Submitted yesterday · Sent ✓ | Priya · Started, not sent · Started | Arjun · Submitted today · Sent ✓.
   - When `visa.sent`, the You row becomes sub "Submitted today" with a `success-soft` "Sent ✓" pill. Source: `selectVisaRows('bali')`.
   - Props: `{ emoji, title, due, rows: { user: User; isYou: boolean; sub: string; status: VisaMember['status'] }[] }`. No fees.
4. Member bubble, Priya: "my passport photo is so bad lol".

User sends come after these (generic `send()` + Go auto-reply "Got it 👍 I’ll factor that into the plan." after 1200ms). Long-press and Ask-Go are the generic behaviour from C-chat-kickoff.md; this group adds no Bali-specific seeds.

**Composer**: standard. The attach menu sends `copy.attachSends.bali[i]` (§1.2). The voice note is unchanged ("🎤 Voice note · 0:06").

### 1.4 `VisaSheet` (G3), owned by P3-7

Files: `src/components/sheets/VisaSheet.tsx` and `src/components/sheets/UploadTile.tsx`. Opened by `?sheet=visa` through `useChatSheets` (P3-9). There is no `VisaField` file: fields use `InputField` (P1-3).

**Props** (props-driven; the page binds the store)
```ts
type VisaUploadKey = 'passport' | 'photo';
type VisaFieldKey = 'name' | 'passport' | 'dob' | 'expiry';
interface VisaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copy: typeof baliVisa.sheet;                                  // seed/visa.ts
  uploads: Record<VisaUploadKey, boolean>;
  fields: Record<VisaFieldKey, string>;
  onUpload: (key: VisaUploadKey) => void;                       // page → setVisaUpload(key)
  onFieldChange: (key: VisaFieldKey, value: string) => void;    // page → setVisaField(key, value)
  onSend: () => void;                                           // page → sendVisa(), then close
}
interface UploadTileProps { title: string; sub: string; pressed: boolean; onPress: () => void }
```
On a tile press, VisaSheet calls `onUpload(key)` and then `toast(upload.toast)`.

**Store**: `chat[tripId].visa` (P2-2). Actions are scoped to the current trip, like the other chat actions.
```ts
visa: {
  uploads: { passport: boolean; photo: boolean };
  fields: { name: string; passport: string; dob: string; expiry: string };
  sent: boolean;
}
```
- `setVisaUpload(key)` sets `uploads[key] = true`. It is one-way.
- `setVisaField(key, value)`.
- `sendVisa()` sets `sent = true` and fires `advance('visa-sent')`, which is a no-op because `visa` is the terminal stage.
- `partialize` excludes `visa.fields`, so passport data is never written to localStorage. `uploads` and `sent` persist.

**Layout**
- `BottomSheet top={250}`. That is 662px tall in the 912 artboard. The dialog has `aria-label="Your visa details"`, the canvas background and a grabber.
- `SheetHeader`: title "Your visa details" + close X; subtitle "Go applies for your Indonesia e-VOA. Takes about 3 minutes."
- `SheetBody`: `px-4 pt-2 pb-[150px] gap-3`.
  1. **Upload row**: `flex gap-2.5` holding 2 × `UploadTile` (`flex-1`).
     - Each tile is `Toggle variant="upload"`: h-28, rounded-4xl, `border-[1.5px] border-dashed border-line-3`, bg-white, flex-col centred, gap-1.5, `aria-pressed`.
     - Tile contents: `<Camera className="size-[22px]" strokeWidth={2}/>`, title text-14 font-semibold, sub text-13 text-muted.
     - Pressed: `bg-success-tint border-success`. The border stays dashed; there is no check and no thumbnail.
     - Tiles: "Passport page" / "Photo or PDF" toasts "Passport page added ✓". "Your photo" / "Plain background" toasts "Photo added ✓".
     - One-way. Every tap toasts, as designed. No file picker.
  2. **Fields**: each is `InputField shape="field"` (h-[52px] rounded-3xl bg-white border-line-2 px-4; input text-16 tracking-body; muted placeholder) with an eyebrow caption. The `<label>` is a column with gap-1.5. The caption is `px-1 text-11 font-bold tracking-eyebrow text-muted`.
     - "FULL NAME, AS ON PASSPORT", placeholder "e.g. Aarav Shah".
     - "PASSPORT NUMBER", placeholder "e.g. Z1234567".
     - A `grid grid-cols-2 gap-2.5` row holds "DATE OF BIRTH" ("DD / MM / YYYY") and "PASSPORT EXPIRY" ("DD / MM / YYYY").
     - All fields are `type="text"`, controlled, with no validation.
  3. **Hint**: `px-1 text-13 text-muted` "Passport must be valid at least 6 months after you land."
  4. **Return flight**: `Card variant="outline" radius="lg"` (18) with `px-3.5`, wrapping a non-interactive `ListRow` (py-3, gap-3).
     - Leading `EmojiTile emoji="✈️" size={36} shape="circle"` with surface-2 tint and a 16px emoji.
     - Title "Return flight" at 15/600. Sub "Added from your bookings · Mon 28 Dec" at 13 muted.
     - Trailing `CheckBadge size={22}`.
- `SheetFooter`:
  - `Button variant="primary" size="xl"` "Send to Go": h-14, 18/500 tracking-h4, full width. Calls `onSend`.
  - `TrustLine` "Only you and Go see this. The group sees “sent”." with Lock 13.
- **Close** (X, scrim, drag-down or Back) only closes the sheet. Uploads and typed fields stay in the store for the session. You stays "Not yet".
- **Send** requires no fields (as designed). It calls `sendVisa()`, the sheet closes, the URL returns to `/trips/bali/chat`, and the You row shows "Sent ✓".
- Not present, as designed: fee, payment, per-member list, document checklist, real camera or file picker.

### 1.5 Invite landing (G1): P3-2 page, P3-16 `InviteSheet`

G1 uses the B7 template: `TripHomeSkeleton` underlay + scrim + `InviteSheet` (top 376, h 536). `B-crew.md` specifies layout, styles and the "WHEN YOU JOIN" rows under `InviteSheet` and `TripHomeSkeleton`. Bali passes the following:

| Prop / data | Bali value |
|---|---|
| hero city | "Bali" (📍 30 + 44/700) |
| hero meta | "📅 Christmas · 25–28 Dec", "👥 2 joined" (`invite.joinedCount`) |
| hero avatar stack (28 / −8) | [Priya, Kabir] (deviation §1.7 #4) |
| hero photo | `goaSunset` (design reuse, §1.7 #10) |
| dialog `aria-label` + title | "Priya invited you" |
| inviter avatar 36 | Priya (deviation §1.7 #4) |
| sub | "Join the trip to plan it together with Go." (unchanged) |
| card photo | `goaBeach` (design reuse) |
| card title / date | "Bali crew" / "Christmas · Fri 25 – Mon 28 Dec" |
| card stack (22 / −7) + line | [Priya, Kabir] + "Priya and Kabir are in" |
| WHEN YOU JOIN rows | unchanged from B7 |
| Accept & join | `acceptInvite('bali-x9m')` then `router.replace('/trips/bali/chat')` (lands on G2) |
| Not now / X / scrim | `/home`. The invite stays listed; this does not call `declineInvite` |
| hero Back/Share, tabs | under the scrim and unreachable (same as B7) |

`acceptInvite('bali-x9m')` appends `aarav` to `trips.bali.memberIds`, removes the invite from the home invites, and initialises `chat.bali` at stage `visa` with an empty `visa` state. A-onboarding.md decides how A6 lists Bali afterwards.

### 1.6 Interactions → actions / toasts

| Screen | Element | Action | Toast (verbatim) |
|---|---|---|---|
| G1 | Accept & join | `acceptInvite('bali-x9m')` → `/trips/bali/chat` | — |
| G1 | Not now / X / scrim | → `/home` | — |
| G2 | Back | `<Link href="/home">` | — |
| G2 | Title block | toast | "Bali’s trip page works like Goa’s. The Goa trip shows the full flow." |
| G2 | Board icon | toast | "Bali’s board works like Goa’s. Open the Goa trip to try it." |
| G2 | 📍 Bali / 📅 Dec 25–28 / 🏡 Stay? chips | toast | "Bali is settled for this group. Stay and dates are next." |
| G2 | 💰 ₹55k chip | `?sheet=budget` | — |
| G2 | 🛫 Bengaluru chip | `?sheet=from` | — |
| G2 | Share | `?sheet=share` (`ShareInviteSheet trip=bali`) | share-sheet toasts per B-crew.md |
| G2 | "Add my passport details" | `?sheet=visa` | — |
| G2 | Visa status rows | none | — |
| G2 | Composer send / mic | `send(text)`, voice note as standard | — |
| G2 | Attach menu row i | `send(copy.attachSends.bali[i])` | — |
| G3 | Passport page tile | `setVisaUpload('passport')` | "Passport page added ✓" |
| G3 | Your photo tile | `setVisaUpload('photo')` | "Photo added ✓" |
| G3 | Field input | `setVisaField(key, value)` | — |
| G3 | X / scrim / drag / Back | close the sheet | — |
| G3 | Send to Go | `sendVisa()` + close | — |

### 1.7 Deviations from the design (flag in code with `// DESIGN-ASSUMPTION`)

1. **Send flips your status.** Send to Go changes the You row to "Sent ✓" with sub "Submitted today". In the design it only navigates back and You stays "Not yet". (PLAN §12.1 #18)
2. **Share sheet uses Bali strings**: "Join Bali crew on Go", `go.vestra.ai/t/bali-x9m`, "Bali crew 🌴". The design left Goa strings here: "Join Goa crew on Go", `goa-k7q`, "Goa crew 🌴". (§12.1 #18)
3. **Attach menu uses Bali strings.** The canned sends swap "Goa packing list" → "Bali packing list" and "Anjuna" → "Denpasar". The PDF and poll strings are unchanged.
4. **Invite avatars match the copy.** The inviter avatar is Priya, and the hero and card stacks are [Priya, Kabir], matching "2 joined" and "Priya and Kabir are in". The design shows Rahul's avatar, a 3-avatar hero stack (Aarav/Rahul/Priya) and a card stack of Rahul/Priya/Aarav.
5. **Visa inputs are controlled.** Values live in `visa.fields`, in memory only and never persisted. In the design the inputs are uncontrolled.
6. **Bali header and chips behave as designed.** Chips, title and board show toasts, and Back goes to `/home`. PLAN §8.1's Goa chat-header rule does not apply to Bali. (§12.1 #18)
7. **G3's underlay is the full `visa` stage.** The design shows only the Go ask under the sheet, which is an artboard simplification.
8. **Chat header uses the standard 170px variant** (§12.1 #8). The design's G2 uses spacing variant 1 (gap 8, title 60).
9. **₹55k and Bengaluru chips open the real sheets** (Budget and From) over the Bali chat. The design links them to Goa artboards. Saving the budget advances no stage, and the chip stays "₹55k".
10. **Images are reused, as designed.** The Bali avatar reuses the Gokarna illustration, and the invite hero and card reuse the Goa photos. The design does this too, so the images are kept. Bali-specific images are an asset question (PLAN §12.3).
11. **The roster is inconsistent between artboards.** The chat header stack, the visa rows and "4 seats" keep the design's You/Rahul/Priya/Arjun. G1's trip roster is Priya + Kabir + you. Both are kept as literal per-artboard seeds, the same approach as §12.1 #1. This is an open question.
12. **The visa CTA is semibold.** "Add my passport details" renders at 15/600 as in the design. The `primary` Button defaults to `font-medium`, so the call site overrides it with `font-semibold`.

### 1.8 Acceptance checklist

**G1: `/invite/bali-x9m` (preset `G1`)**
- [ ] The skeleton underlay shows hero "📍 Bali", "📅 Christmas · 25–28 Dec", "👥 2 joined" and the stack [Priya, Kabir], plus tabs and 2 skeleton blocks. The scrim covers the whole underlay.
- [ ] The sheet sits at top 376 with height 536, `role="dialog"` and `aria-label="Priya invited you"`. It shows Priya's avatar 36 and the title, with the sub verbatim.
- [ ] The card shows "Bali crew" / "Christmas · Fri 25 – Mon 28 Dec" / [Priya, Kabir] / "Priya and Kabir are in". The WHEN YOU JOIN rows match B7.
- [ ] Accept & join lands on `/trips/bali/chat` showing G2. `trips.bali.memberIds` includes `aarav`, and the Bali invite is gone from `/home`.
- [ ] Not now, X and scrim go to `/home`, and the invite is still listed.
- [ ] No "Goa" string is rendered.

**G2: `/trips/bali/chat` (preset `G2`)**
- [ ] Header shows the Bali avatar on #E1F0FA, "Bali crew", and "Christmas · 25–28 Dec" with 4 avatars at 18px.
- [ ] Back goes to `/home`. Title and board toasts are verbatim.
- [ ] The share sheet shows "Join Bali crew on Go", `go.vestra.ai/t/bali-x9m` and "Bali crew 🌴".
- [ ] Chips read: Bali ✓, Dec 25–28 ✓, Stay? (no tick), ₹55k ✓, Bengaluru ✓.
- [ ] The first three chips toast "Bali is settled for this group. Stay and dates are next."
- [ ] ₹55k opens the Budget sheet and Bengaluru opens the From sheet. Closing either returns to G2 unchanged.
- [ ] Messages appear in order: system pill → Go visa ask → visa card → Priya bubble.
- [ ] The Go visa ask has max-width 80%, a 44px black pill CTA with Lock 15 at 15/600, and a 12px terracotta caption.
- [ ] Visa card frame: ml 38 / mr 16, radius 22, `shadow-float`. The head is 18/600 with "due 10 Dec" and a stopwatch.
- [ ] Visa card rows: 4 rows with 32px avatars and hairlines between them. Pills read Not yet (peach), Sent ✓ (green), Started (grey), Sent ✓. Rows are not tappable.
- [ ] The attach menu sends the Bali strings. A typed message gets the Go auto-reply after 1.2s.
- [ ] After sending from G3, the You row reads "Submitted today" with "Sent ✓", and this survives a reload.

**G3: `/trips/bali/chat?sheet=visa` (preset `G3`)**
- [ ] The sheet sits at top 250 (662px tall in a 912 frame) and stays inside the 450px frame. Title and sub are verbatim, with a 40px white X.
- [ ] Two dashed 112px tiles sit side by side with a 10px gap, each with Camera 22.
- [ ] Tapping a tile gives a #F0FAF3 fill, a #16A34A dashed border and the toast. The tile stays pressed with `aria-pressed="true"`.
- [ ] Captions are 11/700 with 0.08em tracking in muted.
- [ ] Fields are 52px tall with radius 16. Placeholders read "e.g. Aarav Shah", "e.g. Z1234567" and "DD / MM / YYYY" ×2. DOB and expiry share one row.
- [ ] The hint is verbatim. The return-flight row shows the ✈️ tile 36, "Return flight", "Added from your bookings · Mon 28 Dec" and a green check 22.
- [ ] The footer has the 56px black "Send to Go" and the trust line with Lock 13 and “sent” in curly quotes. The last body item scrolls clear of the footer (pb 150).
- [ ] Typed values survive close and reopen within the session. They are absent from `localStorage['go-proto-v1']`.
- [ ] X, scrim and drag close without sending, and You stays "Not yet".
- [ ] Send closes the sheet, drops `?sheet=visa` and flips You to "Sent ✓".

### 1.9 Consumed by tasks

| Task | Uses |
|---|---|
| P3-7 | Owns `chat/cards/VisaAskBubble.tsx`, `chat/cards/VisaStatusCard.tsx`, `sheets/VisaSheet.tsx` and `sheets/UploadTile.tsx`. Reads §1.3 (cards), §1.4, and §1.8 G2/G3. Writes no `VisaField` file. |
| P3-2 | Bali branch of `app/invite/[code]/page.tsx`. Reads §1.5 and §1.8 G1. The template is in B-crew.md. |
| P3-9 | Bali chat assembly. Header overrides (Back `/home`, title and board toasts), chip handlers, `visa-ask`/`visa-status` in `MessageRenderer`, and `?sheet=visa\|budget\|from\|share` in `useChatSheets`. Binds the VisaSheet props to the store and wires the Bali attach strings. Reads §1.3, §1.4 and §1.6. |
| P2-1 (seed) | `trips.ts` `bali`, `invites.ts` `bali-x9m`, `visa.ts`, `scenario/bali.ts`, the `copy.ts` Bali toasts and attach strings, and the `G1`–`G3` preset ids. Reads §1.1 and §1.2. |

Interfaces this spec needs from other tasks:
- **P2-2**: `visa.fields`, `setVisaUpload`, `setVisaField`, `sendVisa`, `selectVisaRows`, a `partialize` that excludes `visa.fields`, and the `G1`–`G3` preset patches.
- **P2-5**: an optional `onTitlePress` on `ChatHeader` (title block becomes a button instead of a trip-home link) and an honoured `backHref`.
- **P3-4**: `BudgetSheet` can save without a next-stage pill.
- **P2-3**: `ShareInviteSheet` derives every string from `trip`.

## 2. Inventory (reference)

Pasted verbatim from the screen inventories (`group-E2-G-stays-pay-visa.md`: P-Chat-Visa, P-Chat-VisaSheet, visa-related group notes; `group-A-B.md`: P-Trip-Invite-Bali). Two edits only: headings are demoted one level, and `[Name]` brackets add the PLAN §7 component name after a proposed or element name. This is data about the design, not instructions.

### P-Chat-Visa.dc.html — "Go — Visa ask with CTA"

#### Purpose (1 line)
G2: in a different trip (Bali crew), Go asks for passport details for the Indonesia e-VOA and shows a per-member visa status card.

#### Layout top→bottom
1. Header [ChatHeader] variant 1, **Bali trip**: Back → **P-App-Home.dc.html**; title block is `<a role=button>` → `pa_0` toast; avatar circle bg **#E1F0FA**, img `/_blob/4ff2085905cba57f8e02c6d1ec0b87cd`; title "Bali crew"; sub "Christmas · 25–28 Dec"; same 4 member avatars. Board icon `<a role=button>` → `pa_1` toast. Share → `pa_5`.
2. Chips [FactChipRow + FactChip]: 📍 Bali ✓ (`pa_4` toast); 📅 Dec 25–28 ✓ (`pa_3` toast); 🏡 Stay? (no tick, `pa_2` toast); 💰 **₹55k** ✓ → P-Chat-BudgetSheet-Slider; 🛫 Bengaluru ✓ → P-Chat-FromSheet.
3. System pill [SystemPill]: "Flights to Denpasar on hold · 4 seats".
4. **VISA ASK bubble** [VisaAskBubble → GoBubble] (Go, `max-width 80%; padding 8px 8px 10px 14px; gap 6`):
   - "Go" label; text `padding-right 6px` 16px: "Indian passports need a visa on arrival for Bali. I can apply online for each of you so there’s no queue at the airport 🛂".
   - CTA `<a href="P-Chat-VisaSheet.dc.html">` `margin-top 4; height 44; padding 0 16; gap 6; radius 999; bg #000; #FFF; 15/600; nowrap`: lock svg 15 + "Add my passport details".
   - Privacy note `padding-right 6px; 12px; #A44F3A; lh 1.35`: "Only you and Go see what you add".
5. **VISA STATUS card** [VisaStatusCard → InChatCard] `margin-left 38; margin-right 16; padding 14px 0 10px; radius 22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.08); flex column; gap 6; overflow hidden`:
   - Head `padding 0 16px; space-between; gap 8`: "🛂 Indonesia e-VOA" 18/600 ls -0.014em | deadline [CountdownMeta] 13/500 #4A5878 nowrap gap 4 with stopwatch svg 14 (circle cx12 cy13 r8 + M12 9v4l2.5 2 + M10 2h4): "due 10 Dec".
   - Member list `padding 0 16px`; rows `padding 10px 0; gap 10` (rows 2–4 `border-top 1px #ECEFF3`): avatar 32; name 15/600 + sub 13px #4A5878; status pill [StatusPill] `height 28; padding 0 10; radius 999; gap 4; 13/600; ls 0.002em; nowrap`.
     | Member | Sub | Pill | Pill colours |
     |---|---|---|---|
     | You (c58d972a) | Passport, photo | Not yet | bg #F6EAE6 / #A44F3A |
     | Rahul (cb0a34fd) | Submitted yesterday | Sent ✓ | bg #E3F5EA / #0F7A37 |
     | Priya (234f094a) | Started, not sent | Started | bg #F4F5F7 / #4A5878 |
     | Arjun (8c7b7cb2) | Submitted today | Sent ✓ | bg #E3F5EA / #0F7A37 |
   - Rows are not tappable. No fees shown.
6. Priya bubble [Bubble author=member] (white): "my passport photo is so bad lol".
7. `pSent`; composer (attach sends still Goa strings: "Goa packing list", "Anjuna").

#### Sheets / overlays
Share sheet [ShareInviteSheet] (indices: Messages `pa_6`, Gmail `pa_7`, Copy link `pa_8`, More `pa_9`, backdrop `pa_10`, link Copy `pa_11`). **Still Goa content**: "Join Goa crew on Go", go.vestra.ai/t/goa-k7q, Goa trip image, "Goa crew 🌴" WhatsApp row.

#### State & interactions
- `PBase` `{}`. Toasts:
  - `pa_0` (title) "Bali’s trip page works like Goa’s. The Goa trip shows the full flow."
  - `pa_1` (board) "Bali’s board works like Goa’s. Open the Goa trip to try it."
  - `pa_2`/`pa_3`/`pa_4` (Stay?/date/Bali chips) "Bali is settled for this group. Stay and dates are next."
  - `pa_5` open share.

#### Navigation table
| Element | Target |
|---|---|
| Back | P-App-Home.dc.html |
| Title, board, 📍/📅/🏡 chips | toasts (no nav) |
| 💰 ₹55k chip | P-Chat-BudgetSheet-Slider.dc.html |
| 🛫 chip | P-Chat-FromSheet.dc.html |
| "Add my passport details" | P-Chat-VisaSheet.dc.html |
| Share WA row / tile | P-WA-Compose / P-WA-Pick |

#### Data shown (seed values)
Trip: Bali crew, Christmas · 25–28 Dec, budget ₹55k, from Bengaluru; flights to Denpasar on hold · 4 seats; visa: Indonesia e-VOA due 10 Dec; statuses per table above. Messages as quoted.

#### Icons & images
Lock svg 15 (CTA, white); stopwatch svg 14; emoji 🛂 (Go text + card title); Bali avatar blob 4ff20859… 40px on #E1F0FA; member avatars 32px.

### P-Chat-VisaSheet.dc.html — "Go — Visa details sheet"

#### Purpose (1 line)
G3: private passport form sheet — upload passport page + photo, enter name/number/DOB/expiry, auto-attached return flight, "Send to Go".

#### Layout top→bottom
**Underlying chat** (Bali header same as Visa, with toasts indices shifted): only the Go visa-ask bubble (with its CTA) — no system pill, no status card, no Priya message.

Extra CSS: `button[data-vu][aria-pressed="true"]{background:#F0FAF3 !important;border-color:#16A34A !important}`.

**Backdrop** [BottomSheet overlay] `<a href="P-Chat-Visa.dc.html" aria-label="Close sheet">` z5.

**Dialog** [VisaSheet → BottomSheet] `aria-label="Your visa details"`, `top: 250px` (height 662). Scroll body padding `8px 16px 150px`, gap 12:
1. Title "Your visa details" + X → P-Chat-Visa. Sub: "Go applies for your Indonesia e-VOA. Takes about 3 minutes."
2. **Upload tiles** [UploadTile → Toggle variant=upload] row `flex; gap 10`; two `<button data-vu="1" aria-pressed>`: `flex 1; height 112; radius 18; border 1.5px dashed #CDD3DC; bg #FFF; column centered; gap 6`:
   - Camera svg 22 (path `M4 8h3l2-3h6l2 3h3v11H4z` + circle cx12 cy13 r3.5, stroke 2).
   - Tile 1: "Passport page" 14/600 / "Photo or PDF" 13px #4A5878 → `pa_0`.
   - Tile 2: "Your photo" 14/600 / "Plain background" 13px #4A5878 → `pa_1`.
   - Pressed state (after tap): bg #F0FAF3, border colour #16A34A (dashed stays); text/icon unchanged (no thumbnail, no check).
3. **Fields** [InputField shape=field] (each `<label>` column gap 6; caption `padding 0 4px; 11/700; #4A5878; ls 0.08em; lh 1.35`; field box `height 52; padding 0 16; gap 10; radius 16; bg #FFF; border 1px #DDE1E6`; input 16px ls -0.011em, transparent, no border/outline):
   - "FULL NAME, AS ON PASSPORT" `#vname` placeholder "e.g. Aarav Shah".
   - "PASSPORT NUMBER" `#vpass` placeholder "e.g. Z1234567".
   - 2-col grid (`repeat(2, minmax(0,1fr)); gap 10`): "DATE OF BIRTH" `#vdob` "DD / MM / YYYY" | "PASSPORT EXPIRY" `#vexp` "DD / MM / YYYY". All `type="text"`, uncontrolled (no value/onChange binding, no validation).
4. Hint `padding 0 4px; 13px #4A5878`: "Passport must be valid at least 6 months after you land."
5. **Return flight row** [ListRow + EmojiTile 36 + CheckBadge 22] `padding 12px 14px; gap 12; radius 18; bg #FFF; border 1px #ECEFF3`: ✈️ in 36px circle #F4F5F7 (16px); "Return flight" 15/600; "Added from your bookings · Mon 28 Dec" 13px #4A5878; green check badge 22px #16A34A with check svg 12 (stroke 4).
6. **Footer** [SheetFooter + TrustLine]: CTA `<a href="P-Chat-Visa.dc.html">` 56px #000 18/500 ls -0.014em "Send to Go"; trust line lock svg 13 + "Only you and Go see this. The group sees “sent”."
- NOT present: fee amount, payment, per-member status list, document checklist beyond the 2 tiles, real camera/file picker.

#### Sheets / overlays
Visa sheet (static). Share sheet in markup, unreachable (indices Messages `pa_8`, Gmail `pa_9`, Copy `pa_10`, More `pa_11`, backdrop `pa_12`, link Copy `pa_13`; still Goa content).

#### State & interactions
- State adds `vu0`, `vu1` (undefined → false). `vu0P/vu1P` = 'true'/'false' → `aria-pressed`.
- `pa_0`: `setState({vu0:true})` + toast "Passport page added ✓". `pa_1`: `setState({vu1:true})` + toast "Photo added ✓". One-way (no un-toggle).
- `pa_2..pa_6` same Bali toasts as Visa (title, board, Stay?, date, Bali chip) but unreachable under backdrop; `pa_7` open share (unreachable).
- "Send to Go" just navigates back to P-Chat-Visa — the status card there still shows You "Not yet" (no state carried).

#### Navigation table
| Element | Target |
|---|---|
| Backdrop, close X, "Send to Go" | P-Chat-Visa.dc.html |
| Upload tiles | in-place state + toast |
| (underlying, unreachable) back | P-App-Home.dc.html |
| (underlying, unreachable) Go bubble CTA | P-Chat-VisaSheet.dc.html (self) |

#### Data shown (seed values)
Placeholders: Aarav Shah, Z1234567, DD / MM / YYYY ×2. Return flight Mon 28 Dec. Toasts "Passport page added ✓", "Photo added ✓". Sub "Go applies for your Indonesia e-VOA. Takes about 3 minutes." Trust "Only you and Go see this. The group sees “sent”."

#### Icons & images
Camera svg 22 (×2); check svg 12 (stroke 4) in 22px green badge; lock svg 13; close X 18; ✈️ emoji; underlying lock svg 15 in Go CTA.

### Group notes (group E2 + G) — visa-related excerpts

#### Shared element names (proposed component names)
- **ChatHeader** [ChatHeader] (2 spacing variants: v1 gap8/pad 0 12/h60, v2 gap4/pad 0 8 0 12/h52) + **ContextChipRow** [FactChipRow + FactChip] (chip with optional done-tick; chip state progresses `🏡 Stay?` → `🏡 Villa Sol ✓`).
- **SystemPill** [SystemPill] ("Budget set…", "Villa Sol won · 3 votes", "Flights to Denpasar on hold · 4 seats").
- **GoBubble / MemberBubble / MyBubble** [GoBubble · Bubble author=member · Bubble author=me] (+ inline **@Go mention chip** [MentionChip] inside MyBubble; Go bubble with embedded CTA + privacy footnote in Visa).
- **InChatCard** [InChatCard] shell: `margin-left 38px; margin-right 16px (30px in Book); radius 22; bg #FFF; border 1px #ECEFF3; shadow 0 8px 24px rgba(11,27,63,0.08)` — used by PayAsk/PayLocked card, Visa status card, Book progress card.
- **PageSheet** [BottomSheet + SheetHeader/SheetBody/SheetFooter/TrustLine] (backdrop link + dialog + grabber + title/close + scroll body + gradient footer CTA + lock trust line). Tops: Stay 96px, Pay 342px (+explicit height 570), Visa 250px.
- **StatusPill** [StatusPill] (28h; Not yet / Sent ✓ / Started palettes).
- **SectionCaption** [Eyebrow; InputField caption] 11/700 ls 0.08em #4A5878 ("PAY WITH", field captions); 12px variant "ADDED TO TRIP MONEY".
- **UploadTile** [UploadTile → Toggle variant=upload] (dashed, camera icon, `data-vu` pressed → #F0FAF3/#16A34A).
- Colour tokens recurring: ink #0B1B3F, muted #4A5878, page #F6F7F9, card border #ECEFF3, chip border #DDE1E6, dashed #CDD3DC, Go bubble #F6EAE6 / Go accent #A44F3A, green #16A34A / green-ink #0F7A37 / green-bg #E3F5EA / green-pressed #F0FAF3, star #B7791F, warm note #FFF6F2, neutral fill #F4F5F7/#F2F2F2, record red #B42318, progress empty #E3E5E8, Go avatar bg #DCEBFF, Goa avatar bg #FFF1DC, Bali avatar bg #E1F0FA, WhatsApp #25D366.

#### Sibling-state collapses
- **Visa + VisaSheet** [VisaAskBubble + VisaStatusCard + VisaSheet] = one Bali chat screen + a private-form sheet; the member status card should flip You "Not yet" → "Sent ✓" after Send (not modelled).

#### Navigation graph (this group)
StaySuggest —Details→ Stay-{sol|azul|palms} —(close/backdrop/Vote)→ StaySuggest —(vote any)→ pill → PayAsk —"I’ll book…"→ PaySheet —"Pay & book"→ Book —pill→ P-Chat-Travel; Book —"Fix split"→ P-Money-Everyone. PaySheet close → PayAsk. PayLocked —"Watch Rahul book it"→ Book (PayLocked has no inbound link from these files). Visa —"Add my passport details"→ VisaSheet —(close/backdrop/Send to Go)→ Visa. Outbound: P-TripHome-Zero, P-Board-Poll, P-Board-B, P-Home, P-App-Home, P-Chat-BudgetSheet-Slider, P-Chat-FromSheet, P-WA-Compose, P-WA-Pick.

#### Surprises / ambiguities (items 6, 7, 8, 10)
6. **No fees, no per-member list in VisaSheet**; visa fee never shown. Inputs are uncontrolled; "Send to Go" doesn't update status.
7. **Header/nav drift**: Book's back → P-Home and board → P-Board-B ("Trip plan"), while other Goa screens use P-TripHome-Zero and P-Board-Poll ("Trip board"). Visa back → P-App-Home. PayAsk/PayLocked use header spacing variant 2.
8. **Bali screens reuse Goa share-sheet content** ("Join Goa crew on Go", goa-k7q link, "Goa crew 🌴") and Goa attach strings ("Goa packing list", "Anjuna") — copy bug.
10. **Underlying chats differ per sheet artboard**: Stay-* show the full StaySuggest chat; PaySheet shows only one Go bubble (not the PayAsk card); VisaSheet shows only the Go ask (no status card). Treat as artboard simplification, not a real state.

### P-Trip-Invite-Bali.dc.html — G1 · Bali invite from app home · join · new (doc title "Go — Accept invite · no invite count (v2)")
#### Purpose (1 line)
B7 template [InviteSheet + TripHomeSkeleton] re-used for the Bali invite accepted from App home (A6).
#### Layout top→bottom
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
#### Sheets / overlays
- Same invite sheet [InviteSheet] (top 376, height 536) and ShareSheet [ShareInviteSheet] as B7.
#### State & interactions (from the DCLogic script)
- Identical to B7 (`pa_0`..`pa_6`).
#### Navigation
| element | target |
|---|---|
| backdrop | `P-App-Home.dc.html` |
| sheet Close X | `P-App-Home.dc.html` |
| Not now | `P-App-Home.dc.html` |
| hero Back (covered) | `P-App-Home.dc.html` |
| **Accept & join** | `P-Chat-Visa.dc.html` (Bali goes into the visa chat flow, not TripHome-Zero) |
| tabs (covered) | `P-TripHome-Zero` / `P-Itin-Zero` / `P-Bookings-Zero` / `P-Budget-Zero` |
| ShareSheet recent row / WhatsApp tile | `P-WA-Compose` / `P-WA-Pick` |
#### Data shown (seed values)
- Bali crew. Inviter Priya. Christmas, Fri 25 – Mon 28 Dec. 2 joined. Priya and Kabir are in.
#### Icons & images
- Same as B7.
