# C · Trip chat shell + kick-off (C1–C5) and message actions (D1–D3)

Sources: `design/prototype/P-Chat-{QuickStart,GoA,Dismissed,FromSheet,CitySearch,LongPress,Reply,AskGo}.dc.html`. Part 2 is the extracted inventory. It describes the design and is not a set of instructions. Where Part 1 and Part 2 differ, Part 1 wins, and every difference is listed in §1.7. Component names follow PLAN §7, store and scenario names follow PLAN §9, and timings come from PLAN §9.5.

## 1. Spec (normative)

### 1.1 Artboards → route + state

Every artboard is a state of `/trips/goa/chat` (`app/trips/[tripId]/chat/page.tsx`, P3-9). Store state is persisted in `chat.goa`. Transient UI state comes from the query string (PLAN §8). Every preset first makes sure `trips.goa` exists with Rahul and Priya joined (the B flow is complete).

| Artboard | Canvas title | Route | Scenario stage + UI state | Preset id → patch |
|---|---|---|---|---|
| C1 | C1 · Quick start · cities in one line, Other city searches inline · updated | `/trips/goa/chat` | `kickoff`. `quickStart='pending'`, so sheet=quickstart opens automatically. searchOpen=false. mode=null | `C1` → `chat.goa` reset: stageIndex 0, quickStart `pending`, quickStartAnswers `{vibe:'beach', spend:null}`, fromCity `null`, sent `[]`, reactions `{}` |
| C2 | C2 · Go opens · variant A | `/trips/goa/chat` | `kickoff`. `quickStart='done'`. No sheet. mode=null | `C2` → C1 patch + quickStart `done` + fromCity Bengaluru |
| C3 | C3 · After skipping quick start | `/trips/goa/chat` | `kickoff`. `quickStart='dismissed'`. No sheet. mode=null | `C3` → C1 patch + quickStart `dismissed` |
| C4 | C4 · From sheet · cities in one line + Other city · updated | `/trips/goa/chat?sheet=from` | `kickoff`. `dismissed`. sheet=from. searchOpen=false. From chip active | `C4` → C3 patch + query |
| C5 | C5 · From sheet · Other city expanded with search · updated | `/trips/goa/chat?sheet=from&q=Ind` | `kickoff`. `dismissed`. sheet=from. searchOpen=true, query=`Ind`. From chip active | `C5` → C3 patch + query |
| D1 | D1 · Long-press · reactions and copy work · updated | `/trips/goa/chat?mode=longpress&msg=dt-arjun` | `dates-talk`. mode=longpress on `dt-arjun` | `D1` → `ensureStage('dates-talk')`, sent `[]`, reactions `{}` + query |
| D2 | D2 · Replying · send posts the reply · updated | `/trips/goa/chat?mode=reply&msg=dt-arjun` | `dates-talk`. mode=reply on `dt-arjun`. Tray draft `works if we leave fri night` | `D2` → D1 patch + query |
| D3 | D3 · Ask Go · suggestions fill the box · updated | `/trips/goa/chat?mode=askGo&msg=dt-arjun` | `dates-talk`. mode=askGo on `dt-arjun`. Tray draft `''` | `D3` → D1 patch + query |

Query → UI state. `useChatSheets` and `useComposerModes` (P3-9) own this mapping.
- `sheet`: `quickstart|from|share|board|…`.
- `q` is a new param. When present, the open QuickStart or From sheet starts in search mode with that query.
- `mode`: `longpress|reply|askGo`. `longpress` is new. It is always paired with `msg=<message id>`.
- Taps update the URL with `history.replaceState`. Presets and deep links push the URL.
- While `quickStart==='pending'` in stage `kickoff`, the quickstart sheet is open whatever the `sheet` param says.
- Only one content sheet can be open at a time.

### 1.2 Chat shell anatomy (the contract for P2-5)

Order from top to bottom inside `Screen scroll="none"`:
1. `ChatHeader`, containing `FactChipRow`.
2. `MessageList`.
3. `Composer` or `ComposerTray`, absolute at the bottom.
4. Overlays: `LongPressOverlay`, sheets, toasts.

All components are driven by props. None of them reads the store. Static UI copy is imported from `src/data/seed/copy.ts`. Content arrives through props.

Shared types. P2-1 adds them to `src/data/types.ts`.
```ts
type AvatarSpec = { kind: 'go' } | { kind: 'user'; src?: string; initials: string; tone: User['tone'] };
type FrameRect = { top: number; left: number; width: number; height: number }; // px, relative to #app-frame
type AttachItem = 'photo' | 'pdf' | 'location' | 'poll';
type ComposerMode = null | 'longpress' | 'reply' | 'askGo';
type BubbleMaxWidth = 64 | 70 | 72 | 76 | 78 | 80;
```

**ChatHeader** (`chat/ChatHeader.tsx`)
```ts
interface ChatHeaderProps {
  trip: { name: string; avatar: string; tint: Trip['tint'] };
  subtitle: string;
  members: AvatarSpec[];        // stage memberIds, max 4, never Kabir
  backHref: string;             // `/trips/${tripId}`
  onBoard(): void;              // → ?sheet=board
  onShare(): void;              // → ?sheet=share
  children: React.ReactNode;    // <FactChipRow/>
}
```
- Container: `relative z-[2] bg-white pt-safe pb-3 shadow-header`. Height is **170px** = 56 + row 52 + 14 + chips 36 + 12. Every artboard uses this one variant.
- Row: `flex items-center gap-1 pl-3 pr-2` (design padding 0 8 0 12).
  - **Back**: `Button asChild variant=ghost size=icon` (44) wrapping `<Link href={backHref} aria-label="Back">`, `text-black`, `ArrowLeft className="size-[22px]" strokeWidth={2}`.
  - **Title block**: `<Link href={backHref}>` with `flex min-w-0 flex-1 h-[52px] px-1 items-center gap-2.5`.
    - `Avatar kind=trip size=44` (bg-amber-soft, image 40).
    - Column `min-w-0 flex-1 flex flex-col gap-0.5`:
      - Title: `text-16 font-semibold tracking-body leading-[1.25] truncate`.
      - Subtitle row `flex min-w-0 items-center gap-1.5`: `AvatarStack size=18 overlap=-5 ring=white-thin` (wrapper `pl-[5px]`), then `text-13 text-muted truncate`.
  - **Board**: `Button variant=ghost size=icon aria-label="Trip board"`, `text-black`, `Board className="size-5"`.
  - **Share**: `Button variant=ghost size=icon aria-label="Share trip invite"`, `text-black`, `Share className="size-5"`.
- `children` follows the row.

**FactChipRow** (`chat/FactChipRow.tsx`). `FactChip` is the data shape for one chip. It has no file of its own; the row renders `Chip` atoms directly.
```ts
interface FactChipData { key: ChipKey; emoji: string; label: string; state: 'unset' | 'set'; active?: boolean; onPress(): void }
interface FactChipRowProps { chips: FactChipData[] }   // always where, when, stay, budget, from
```
- Row: `mt-3.5 flex gap-2 px-5 overflow-x-auto scrollbar-none overscroll-x-contain`.
- Each chip is `Chip size=md` (h-9 px-[14px] text-14 font-medium tracking-sm, 5px gap) with `shrink-0` and `emoji` (16px slot, 14px glyph, aria-hidden).
- States:
  - **unset**: `variant=outline`. The label is the question, e.g. "Where?".
  - **set**: `variant=outline` with `check`, which adds a trailing `CheckBadge size=16` (check 9px, stroke 4).
  - **active** (its sheet is open): `variant=active` (border-black ring-1 ring-black font-semibold). A set chip that is also active keeps its `check`.
- Emoji: where 📍 · when 📅 · stay 🏡 · budget 💰 · from 🛫.
- Press actions (PLAN §8.1):
  - Where: if set → `?sheet=board`; otherwise `ensureStage('places')` and scroll.
  - When → `ensureStage('dates-poll')` and scroll.
  - Stay → `ensureStage('stays')` and scroll.
  - Budget → `ensureStage('budget')` and `?sheet=budget`.
  - From → `?sheet=from`.
- `active` rules:
  - from is active when sheet=from (C4/C5).
  - budget is active when sheet=budget (E6/E7).
  - While QuickStart is open, no chip is active.

**MessageList** (`chat/MessageList.tsx`) and **useScrollToEnd** (`chat/useScrollToEnd.ts`)
```ts
interface MessageListProps { bottomPadding: 96 | 150 | 190; anchorRef: React.RefObject<HTMLSpanElement | null>; children: React.ReactNode }
function useScrollToEnd(anchorRef: React.RefObject<HTMLElement | null>, deps: readonly unknown[]): void
```
- Scroller: `flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none`.
- Inner: `flex flex-col gap-2.5 px-4 pt-4` plus a padding class picked from a static map: `pb-24` | `pb-[150px]` | `pb-[190px]`.
- bottomPadding by mode: 96 for mode null or longpress, 150 for reply, 190 for askGo.
- The last child is the sentinel `<span ref={anchorRef} data-chat-end className="block h-px" />`.
- `useScrollToEnd`:
  - On first run it calls `scrollIntoView({ block: 'end' })` with no animation.
  - On each later change of `deps` (P3-9 passes `[messages.length, bottomPadding]`) it waits `SCROLL_DELAY_MS` (60), then calls `scrollIntoView({ behavior: 'smooth', block: 'end' })` inside try/catch.
- No date separators, timestamps, read receipts or typing indicators.

**SystemPill** (`chat/SystemPill.tsx`). `{ text: string; avatar?: boolean /* default true → Go avatar 20 */ }`
- Classes: `self-center my-0.5 flex items-center gap-1.5 rounded-full bg-white py-[5px] pl-[5px] pr-3 shadow-bubble text-13 text-muted tracking-caption leading-[1.35]`.
- Leading `Avatar kind=go size=20`.

**Bubble** (`chat/Bubble.tsx`)
```ts
interface BubbleProps {
  author: 'go' | 'member' | 'me';
  name?: string;                      // member first name (go label comes from copy: "Go"; me has no label)
  avatar?: AvatarSpec;                // go/member, rendered at 30px; ignored for me
  maxWidth?: BubbleMaxWidth;          // default member 72 · go 76 · me 78
  quote?: { author: string; text: string };   // me only → QuoteBlock above the text
  mention?: boolean;                  // me only → MentionChip "Go" before the text
  reaction?: { emoji: string; count: number };
  footer?: React.ReactNode;           // GoBubble CTA/caption (E/F groups)
  enter?: boolean;                    // true for messages appended after mount
  lifted?: boolean;                   // LongPressOverlay copy: scale-[1.03] origin-left
  bubbleRef?: React.Ref<HTMLDivElement>;
  pressHandlers?: ReturnType<typeof useLongPress>;  // member only
  children: React.ReactNode;          // text; whitespace-pre-line ("\n" = design ⏎)
}
```

| | go | member | me |
|---|---|---|---|
| row | `flex items-end gap-2` + `Avatar kind=go size=30` | `flex items-end gap-2` + `Avatar size=30` (user tone fallback) | `flex justify-end`, no avatar |
| fill | `bg-go-soft shadow-bubble` | `bg-white shadow-bubble` | `bg-black text-white`, **no shadow** |
| radius | `rounded-5xl rounded-bl-none` (20/20/20/0) | same as go | `rounded-5xl rounded-br-none` (20/20/0/20) |
| padding · gap | `px-3.5 pt-2 pb-2.5 gap-0.5` (8/14/10 · 2) | same as go | `px-3.5 py-2.5 gap-1` (10/14 · 4) |
| label | "Go", `text-13 font-semibold text-go tracking-caption leading-[1.35]` | name, same classes with `text-muted` | none |
| body | `text-16 tracking-body leading-[1.4] text-pretty whitespace-pre-line` | same | same |
| max-width | 76% | 72% | 78% |

- Bubble layout is `flex flex-col`.
- `maxWidth` maps through a static class map (`max-w-[64%]` … `max-w-[80%]`). Never build class names from template strings. The max-width sits on a column wrapper (`flex flex-col items-start`) that holds the bubble and, when present, the reaction chip.
- **Reaction**: the `ReactionChip` renders under the bubble with `relative -mt-1.5 ml-2.5`, overlapping the bubble's bottom edge by 6px and inset 10px from its left edge.
- **Enter animation** (when `enter` is true, and on the reaction chip): `transition-[opacity,transform] duration-220 ease-[var(--ease-out)] starting:opacity-0 starting:translate-y-1.5`. Messages already in history on first render do not animate.
- **Member bubbles with `pressHandlers`**:
  - Add `select-none [-webkit-touch-callout:none]`.
  - Add `role="button" tabIndex={0} aria-haspopup="dialog"`.
  - Leave touch-action at its default, so a vertical scroll fires `pointercancel`.

**GoBubble** (`chat/GoBubble.tsx`). `{ children: React.ReactNode; maxWidth?: BubbleMaxWidth; cta?: { label: string; onPress(): void }; caption?: string }`. It renders `Bubble author=go` with a footer. The E/F groups use it; this group does not.

**QuoteBlock** (`chat/QuoteBlock.tsx`). `{ author: string; text: string }`
- Classes: `rounded-lg bg-white/14 border-l-[3px] border-go-line px-2.5 py-1.5 text-13 leading-[1.35]`.
- Renders `{author} · {text}`.
- Used inside `me` bubbles only.

**ReactionChip** (P2-3, `common/ReactionChip.tsx`). `{ emoji: string; count: number; floating?: boolean }`
- Classes: `inline-flex items-center gap-[3px] rounded-full border border-line bg-white px-2 py-0.5 text-13 font-semibold`.
- Text: `{emoji} {count}`.

**QuickReplyBlock** (`chat/QuickReplyBlock.tsx`). `{ eyebrow: string; chips: { label: string; onPress(): void }[] }`
- Container: `ml-[38px] flex flex-col gap-2`.
- `Eyebrow tone=muted` (11/700, tracking-eyebrow).
- Then `flex flex-wrap gap-2` of `Chip size=lg variant=outline` (40px, 14/600). Emoji stays inline in the label.

**NextStepPill** (`chat/NextStepPill.tsx`). `GoNudgePill` is the same component under another name; there is no second file. `{ label: string; onPress?(): void; href?: string }`
- Renders `Button variant=navy`, with `asChild` + `<Link>` when `href` is set.
- Classes: `self-center mt-1.5 h-[42px] pl-1.5 pr-3.5 gap-2 text-14 font-semibold shadow-pill`. These override the compound `font-medium`, and 42px is not a Button size.
- Contents: `Avatar kind=go size=30`, the label, then `ChevronRight className="size-3.5" strokeWidth={2.6}`.
- Enter animation: `starting:opacity-0 starting:translate-y-1.5 duration-220`.

**Composer** (`chat/Composer.tsx`)
```ts
interface ComposerProps {
  value: string; onChange(v: string): void;
  onSend(text: string): void;          // trimmed, non-empty; MicSend press or Enter
  recording: boolean;
  onMic(): void;                       // MicSend press with empty draft
  attachOpen: boolean; onAttachOpenChange(open: boolean): void;
  onAttach(item: AttachItem): void;
}
```
- Wrapper: `FadeDock variant=gradient` (absolute inset-x-0 bottom-0, transparent at the top, `canvas` from 35%).
- Row: `relative flex items-center gap-2.5 px-4 pt-6 pb-safe`. Height is 96px when the safe area is 24.
- **Add**: the `AttachMenu` trigger, `Button variant=white size=icon-lg aria-label="Add" aria-expanded={attachOpen}` (48, shadow-btn) with `Plus className="size-5"`.
- **Input**: a `<label>` wrapping `Input shape=pill` (h-12 rounded-full bg-white px-4, no border and no shadow).
  - Visually hidden text "Message".
  - `id="msg"`, placeholder "Message, or @Go", `text-16 tracking-body`.
  - Enter sends.
- **MicSendButton**.
- **RecordingPill** while `recording` is true.
- Branching:
  - MicSend press → `value.trim()` ? `onSend(trimmed)` : `onMic()`.
  - Opening attach also ends recording without sending (P3-9).

State machine. P3-9 owns this in `useComposerModes`.
- `onSend(t)` → `send(t)`, then clear the draft.
- `onMic()`:
  - If recording → stop, then `send("🎤 Voice note · 0:06")`.
  - Otherwise → start recording and set `attachOpen=false`.
- `onAttachOpenChange(true)` → `recording=false`.

**MicSendButton** (`chat/MicSendButton.tsx`). `{ hasDraft: boolean; recording: boolean; onPress(): void }`
- Renders `Button size=icon-lg variant={recording ? 'danger' : 'primary'}` containing `MicSendIcon` (Mic ↔ ArrowRight, 20px).
- aria-label, checked in this order: "Send" if there is a draft, else "Stop and send voice note" if recording, else "Voice message".

**AttachMenu** (`chat/AttachMenu.tsx`). `{ open: boolean; onOpenChange(open: boolean): void; onPick(item: AttachItem): void; children: React.ReactNode /* trigger */ }`
- `DropdownMenu` with `side="top" align="start" sideOffset={12}`. With a 24px safe area, the menu's bottom edge sits 84px above the frame bottom.
- Content: `w-[220px] rounded-4xl bg-white p-0 shadow-pop overflow-hidden`.
- Four `MenuItem` rows (h-12 px-[14px] gap-3 text-15 font-semibold, hairlines between), each with an 18px emoji:
  - 📷 Photo
  - 📄 Ticket or PDF
  - 📍 Location
  - 🗳️ Poll
- Picking a row closes the menu and sends the matching canned message:
  - "📷 Photo · Goa packing list"
  - "📄 Shared a PDF · IndiGo e-ticket"
  - "📍 Shared location · Anjuna"
  - "🗳️ Poll · Scuba on Sunday? Yes / No"

**RecordingPill** (`chat/RecordingPill.tsx`). No props; the copy comes from copy.ts.
- Sits 12px above the composer row, right-aligned (`absolute right-4 bottom-[calc(100%-12px)]` on the composer wrapper; the design value is bottom 84).
- Classes: `flex h-10 items-center gap-2 rounded-full bg-danger px-3.5 text-14 font-semibold text-white`, plus the enter animation.
- `LiveDot size=8 pulse className="bg-white"` (white dot; the pulse halo stays green as designed), then "Recording… tap the mic to send".

**ComposerTray** (`chat/ComposerTray.tsx`)
```ts
interface ComposerTrayProps {
  mode: 'reply' | 'askGo';
  banner: { title: string; snippet: string; accent: 'go' | 'ink' };
  suggestions?: string[];              // askGo; tap → onChange(s), never sends
  value: string; onChange(v: string): void;
  placeholder: string;
  onSend(text: string): void;          // trimmed; caller decides what '' means
  onCancel(): void;
}
```
- Container: `absolute inset-x-0 bottom-0 flex flex-col gap-2 rounded-t-6xl bg-white px-4 pt-2.5 pb-safe shadow-tray`. 6xl is the 22px radius.
- **Banner**: `flex items-center gap-2.5 rounded-2xl bg-surface-2 py-2 pr-2 pl-3 border-l-[3px]`, with `border-go` for reply and `border-ink` for askGo.
  - Text column `min-w-0 flex-1 flex flex-col gap-px`:
    - Title: `text-13 font-bold`, coloured `text-go` or `text-ink`. In askGo it is `inline-flex items-center gap-1.5` with a leading `Avatar kind=go size=18`.
    - Snippet: `text-14 text-muted truncate`.
  - Cancel: `Button variant=ghost size=icon-2xs aria-label="Cancel"` (32), `text-muted`, `X className="size-3.5"`.
- **Suggestions** (askGo only): `flex gap-1.5 overflow-x-auto scrollbar-none` of `Chip size=xs variant=outline shrink-0` (36px, 13/600). Chips have no pressed state.
- **Input row**: `flex items-center gap-2.5`.
  - `Input shape=pill-grey` (h-12 rounded-full bg-surface-2), focused when the tray mounts.
  - Send: `Button variant=primary size=icon-lg aria-label="Send"` with `ArrowRight className="size-5"`.
  - No Add button and no mic.

**LongPressOverlay** (`chat/LongPressOverlay.tsx`)
```ts
interface LongPressOverlayProps {
  message: { id: string; name: string; text: string; avatar: AvatarSpec; maxWidth?: BubbleMaxWidth };
  anchorRect: FrameRect;               // rect of the pressed bubble row
  onReact(emoji: string): void;
  onMore(): void;
  onReply(): void; onAskGo(): void; onCopy(): void;
  onClose(): void;                     // backdrop, Escape
}
```
- **Backdrop**: `<button aria-label="Close">` with `absolute inset-0 z-[5] bg-scrim-strong backdrop-blur-[6px]`.
- **Column**: `absolute inset-x-4 z-[6] flex flex-col gap-2.5`, `role="dialog" aria-label="Message actions"`.
  - `style.top` = `anchorRect.top − 60` (reaction bar 50 + gap 10). Clamp it so the column stays at least 16px inside the frame top and bottom. Dynamic value, so an inline style is allowed.
- **Reaction bar**: `self-start ml-[30px] flex gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-menu`.
  - Six emoji buttons, ❤️ 😂 🔥 👍 😮 🙏: `Button variant=ghost size=icon className="size-[42px] text-24" aria-label="React {emoji}"`.
  - More: `Button variant=soft size=icon className="size-[42px] text-muted" aria-label="More reactions"` with `Plus className="size-[18px]"`.
- **Lifted bubble**: `Bubble author=member lifted` (`scale-[1.03] origin-left`), with the same name, avatar and text and no reaction chip.
- **Menu**: `ml-[38px] w-[230px] overflow-hidden rounded-4xl bg-white shadow-menu`, three `MenuItem variant=wide` rows (h-[52px] px-4 justify-between text-16 font-medium, hairlines between):
  - "Reply" + `Reply className="size-[18px] text-muted"`.
  - "Ask Go" + `Avatar kind=go size=22`.
  - "Copy" + `Copy className="size-[18px] text-muted"`.
  - `MenuItem` must render as a plain `<button>` outside a DropdownMenu context. P1-5 owns this.
- No enter animation (as designed).
- Focus moves to the first reaction. Escape calls `onClose`.

**useLongPress** (`chat/useLongPress.ts`)
```ts
function useLongPress(
  onLongPress: (target: HTMLElement) => void,
  opts?: { ms?: number /* default LONG_PRESS_MS = 500 */; moveTolerance?: number /* default 8 px */ },
): {
  onPointerDown: React.PointerEventHandler; onPointerMove: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler; onPointerCancel: React.PointerEventHandler;
  onPointerLeave: React.PointerEventHandler; onContextMenu: React.MouseEventHandler;
  onKeyDown: React.KeyboardEventHandler;
}
```
- Listens to the primary pointer only.
- `pointerdown` starts the timer. It is cleared on up, cancel or leave, or when the pointer moves more than 8px from where it started, so a scroll never fires it.
- `onContextMenu` calls preventDefault to suppress the native callout.
- Enter or Space fires immediately (keyboard path).

**InChatCard / HorizontalRail**: P2-5 owns them, but the C/D artboards don't use them. Their contracts are in PLAN §7.2 and `E-deciding.md`.

**ShareInviteSheet** (P2-3, `shell/ShareInviteSheet.tsx`). `{ trip: Trip; open: boolean; onOpenChange(open: boolean): void }`
- Opened by the header share button (`?sheet=share`).
- Anatomy, strings and toasts are in Part 2, "Share-invite sheet".
- Target behaviour follows PLAN §7.2: WhatsApp and the recent row call `share.inviteViaWhatsApp`; Messages, Gmail and More call `share.inviteNative`, with the design toasts as fallback; Copy and Copy link copy to the clipboard and toast "Invite link copied".

**Toasts**: `toastGo(text)` from `lib/toast.ts` (sonner: bottom offset 108, 2200ms, 1 visible, navy pill).

**Z-order (this route)**

| Layer | z | Rule |
|---|---|---|
| ChatHeader | 2 | `relative z-[2]` |
| MessageList, Composer / ComposerTray, RecordingPill | auto | DOM order (composer after list) |
| Content sheets (BottomSheet / vaul: quickstart, from, board, …) | P1-5's value | above the header; they never coexist with the long-press overlay (each scrim blocks the other's trigger) |
| LongPressOverlay | 5 scrim / 6 column | |
| ShareInviteSheet | 40 | ≥ content sheets |
| Toaster | 60 | above everything, sheets and overlay included |

### 1.3 Scenario stages `kickoff` and `dates-talk`

#### `kickoff` (stage index 0, C1–C5)

Header subtitle and members depend on `quickStart`. PLAN §9.3 gives "Just created · 2 joined" for every state except dismissed. Here C1 follows its artboard instead.

| quickStart | Artboards | Subtitle | Members | Messages, in order |
|---|---|---|---|---|
| `pending` | C1 | "Rahul joined" | aarav, rahul | `ko-sys`, `ko-go-open` |
| `done` | C2 | "Just created · 2 joined" | aarav, rahul | `ko-sys`, `ko-go-open`, `ko-quick` |
| `dismissed` | C3, C4, C5 | "Rahul and Priya joined" | aarav, rahul, priya | `ko-sys`, `ko-go-open`, `ko-priya`, `ko-nudge` |

| id | author · kind | Content (verbatim) | Visibility |
|---|---|---|---|
| `ko-sys` | system | "Trip created · Rahul joined" (unchanged in C3 even though Priya joined) | always |
| `ko-go-open` | go · text | "What’s the plan, crew? 🌴⏎Where are we thinking of going?" | always |
| `ko-quick` | go · card `quick-replies` | eyebrow "TAP TO REPLY". Chips "🏖️ Beach", "⛰️ Mountains", "🤷 Not sure, suggest some" | `quickStart==='done'`, live |
| `ko-priya` | priya · text | "goa for diwali?? 🌴" | `quickStart==='dismissed'` |
| `ko-nudge` | go · card `go-nudge` | "Go suggests places from the chat" | `quickStart==='dismissed'`, live |

"Live" means the message renders only while its stage is the current stage. Once the stage advances it leaves the history.

Chips:
- "Where?", "When?", "Stay?" and "Budget?" are unset.
- From shows "From?" (unset) or `fromCity.name` (set).

Triggers and transitions:
- **First visit** with `pending` → the QuickStart sheet is open (no timer).
- QuickStart **Done** → `completeQuickStart(answers, from)` → C2.
- **Not now**, X, scrim, drag-down or Back → `dismissQuickStart()` → C3.
- Neither of those changes `stageIndex`.
- A **reply chip** (any of the three) or the **nudge** → `advance('place-asked')` → `places` (E1).
  - No bubble is posted (as designed).
  - `ko-quick` and `ko-nudge` disappear.
- **Default-composer sends** → my bubble, then the Go ack after `GO_REPLY_MS` (1200). The stage does not change.
- The **From chip** opens the From sheet (C4) in `done` or `dismissed`. In `pending` it sits under the QuickStart scrim.
- `ensureStage(x)` with x past kickoff first applies the kickoff default: `quickStart='done'`, `fromCity ??= Bengaluru`.

#### `dates-talk` (D1–D3)

It is reached from `places` through the pill "Goa won the vote · pick dates next" (`E-deciding.md`) or through `ensureStage`.
- Subtitle: "Goa · picking dates".
- Members: aarav, rahul, priya, arjun. Kabir is excluded (PLAN §12.1 #1).
- Chips:
  - "Goa": set; pressing it opens the board sheet.
  - "When?", "Stay?" and "Budget?": unset.
  - From: `fromCity?.name ?? "Bengaluru"`, set. From `places` onward the chip falls back to the seed city.
- Messages, in the artboard's order:

| id | author | Text (verbatim) | Extra seed fields |
|---|---|---|---|
| `dt-priya` | priya | "diwali weekend? 🪔" | — |
| `dt-kabir` | kabir | "christmas i’m at home in kochi" | — |
| `dt-arjun` | arjun | "in, but only after 6pm fri 😭" | `replyDraft: "works if we leave fri night"`, `askGoSuggestions: ["Flights after 6 pm Fri?", "Can we leave Sat morning?", "Sum up everyone’s dates"]` |

Triggers and next-stage behaviour (next stage: `dates-poll`, E5, spec in `E-deciding.md`; first message from Go: "Got it. I checked everyone’s calendars and leave. Here’s what works 👇", then the `dates-poll` card):
- **Fallback nudge**: a `NextStepPill` "Go checked everyone’s calendars".
  - It appears `DATES_NUDGE_MS` (2500) after `dates-talk` becomes current with `mode===null`.
  - The timer is cleared whenever a mode opens and restarts when mode returns to null. So presets D1–D3 don't show it until their overlay or tray closes.
  - Once shown, it stays until the stage changes.
  - Tap → `advance('dates-asked')`.
- **Reply send** (D2):
  - t0: my bubble with its quote.
  - t0 + 1200: the Go ack.
  - t0 + 1800 (`GO_TYPING_MS` after the ack): `advance('dates-asked')`.
- **Ask-Go send** (D3):
  - If the draft is non-empty, post my bubble (mention + quote, no generic ack).
  - Then `advance('dates-asked')` after `GO_TYPING_MS` (600). This also runs with an empty draft, as designed.
- **Default-composer sends**: bubble + ack only, no advance.

Ordering rule for `selectMessages`:
- Every sent message records `stage` = the current stage at send time. A Go ack takes the stage of the message it acknowledges.
- Render stage by stage: stage k's seed messages, then stage k's sent messages in send order, then stage k+1.
- PLAN §9.3 says sent messages are appended "at the end". That would place D2's reply after the dates-poll card.

### 1.4 Sheets owned by P3-3

All four components are props-only. P3-9 wires them to the store. Types are added by P2-1:
```ts
interface CityRef { id: string; name: string; region?: string }  // CIT ids (blr…); searched cities: id = name.toLowerCase()
type Vibe = 'beach' | 'hills' | 'city' | 'any';
type Spend = 'lt15' | '15to25' | 'gt25';
interface QuickStartAnswers { vibe: Vibe | null; spend: Spend | null }
```

**QuickStartSheet** (`sheets/QuickStartSheet.tsx`)
```ts
interface QuickStartSheetProps {
  open: boolean;
  initial: { answers: QuickStartAnswers; from: CityRef | null }; // first open: {vibe:'beach', spend:null} + Bengaluru
  initialQuery?: string | null;          // ?q= → opens in search mode
  onDone(answers: QuickStartAnswers, from: CityRef | null): void;
  onDismiss(): void;                     // Not now, X, scrim, drag-down, Back
}
```
- Container: `BottomSheet`, `aria-label="Quick start"`.
  - Collapsed height: `h-[min(528px,calc(100%-96px))]`, which is top 384 on the 912px design frame.
  - Search open: `h-[calc(100%-96px)]` (top 96).
  - The switch is instant (as designed).
- Body: `SheetBody` with `gap-3 pb-[150px]`. Contents in order:
  1. `SheetHeader`:
     - Title "Quick start".
     - Close (aria-label "Close") → `onDismiss`.
     - Subtitle "Help Go plan for the crew. Takes 10 seconds."
  2. `ChoiceChipGroup` "WHAT VIBE?" with `allowDeselect`. Options:
     - beach "🏖️ Beach"
     - hills "⛰️ Hills"
     - city "🏙️ City"
     - any "🤷 Surprise us"
  3. `ChoiceChipGroup` "SPEND EACH?" with `allowDeselect`. Options:
     - lt15 "Under ₹15k"
     - 15to25 "₹15–25k"
     - gt25 "₹25k+"
  4. Group `role="group" aria-label="Travelling from"`:
     - Header row `flex justify-between px-1`: `Eyebrow` "TRAVELLING FROM?" on the left, "🔒 Just for your tickets" (`text-12 font-semibold text-muted`) on the right.
     - `CityPicker allowDeselect`.
  5. Footnote "Skip anything. You can set where you’re travelling from anytime with the From chip up top." (`px-1 text-13 text-muted tracking-caption`).
- `SheetFooter`:
  - `Button variant=primary size=xl` "Done" → `onDone(local answers, local from)`.
  - `Button variant=link size=base` "Not now" (h-11, text-16, text-go) → `onDismiss`.
- Local draft state is initialised from `initial` each time the sheet opens. Nothing is written before Done.
- Store wiring (P3-9):
  - Done → `completeQuickStart(answers, from)`. This sets quickStart `done`, saves `quickStartAnswers`, sets `fromCity = from` and closes the sheet.
  - Dismiss → `dismissQuickStart()`. This sets quickStart `dismissed`, saves nothing and closes the sheet.

**FromCitySheet** (`sheets/FromCitySheet.tsx`)
```ts
interface FromCitySheetProps {
  open: boolean;
  initialCity: CityRef;                  // fromCity ?? seed Bengaluru (blr)
  initialQuery?: string | null;          // ?q=Ind → C5
  onSave(city: CityRef): void;
  onClose(): void;                       // X, scrim, drag, Back — nothing saved
}
```
- Container: `BottomSheet`, `aria-label="Travelling from"`.
  - Collapsed height: `h-[min(465px,calc(100%-96px))]` (top 447).
  - Search open: `h-[calc(100%-96px)]`.
- Body `gap-3 pb-[120px]`:
  1. `SheetHeader`: title "Travelling from" + close; subtitle "Where will you start your trip?".
  2. Column `gap-2`: `Eyebrow` "YOUR CITY", then `CityPicker allowDeselect={false}`.
  3. `InfoNote` (peach, `Lock className="size-4"`): "Only you and Go see this. Go uses it for your flights, trains and buses."
- Footer: `Button variant=primary size=xl` "Save" → `onSave(local city)`.
- Store wiring (P3-9):
  - Save → `setFromCity(city)`.
    - The chip becomes 🛫 `{name}` with `CheckBadge 16`, e.g. "Bengaluru ✓" or "Indore ✓".
    - The `sheet` param is removed.
    - The chat underneath keeps its state (C3, C2 or a D state).
  - Close → no write.

**CityPicker** (`sheets/CityPicker.tsx`). Search state is lifted to the sheet because the sheet's height depends on it.
```ts
interface CityPickerProps {
  value: CityRef | null;
  onChange(city: CityRef | null): void;
  allowDeselect: boolean;                // QuickStart true, From false
  searchOpen: boolean; onSearchOpenChange(open: boolean): void;
  query: string; onQueryChange(q: string): void;
}
```
- **Strip**: `-mx-4 px-4 flex gap-1.5 overflow-x-auto scrollbar-none`, single line.
  - Items: `[picked, ...CIT]`. `picked` is the last search result chosen in this sheet session, or `value` when `value` is not in CIT.
  - Each item: `Chip size=lg pressed={on} shrink-0 transition-colors duration-160`. Label: `on ? "📍 " + name : name`.
  - Tap: if the chip is on and `allowDeselect` → `onChange(null)`; otherwise `onChange(city)`.
- **Collapsed** (`searchOpen` false): `<div className="flex">` holding `Chip size=lg variant=dashed` (OtherCityChip) with `Search className="size-4"` and "Other city" → `onSearchOpenChange(true)`. The query is kept.
- **Search open**: column `gap-2.5` with the enter animation. Contents:
  1. `SearchField` (`Input shape=search`: h-[52px] rounded-3xl border-[1.5px] border-ink pl-4 pr-2 gap-2.5).
     - Leading `Search className="size-[18px] text-muted"`.
     - Visually hidden text "Search a city".
     - `type="search"`, placeholder "Search a city, state or country", autoFocus.
     - Clear: `Button variant=soft size=icon-xs aria-label="Clear search"` (36) with `X className="size-3.5 text-muted"` → `onQueryChange('')`.
  2. `ResultList` (`Card variant=outline radius=lg px-3`).
     - Each row is `<button aria-pressed>` with `flex w-full items-center gap-3 px-1 py-2.5 text-left border-t border-line first:border-t-0`.
     - `bg-success-tint` when `value?.id === row.id`.
     - Row contents:
       - `EmojiTile emoji="📍" size=34 shape=circle` on `surface-2`. Size 34 is missing from EmojiTile; report the gap to P1-2 rather than forking the component.
       - Name: `text-16 font-semibold`.
       - Region: `text-13 text-muted` (column gap-px).
     - Empty state: "No matches. Try a nearby bigger city." (`px-1 py-4 text-13 text-muted`).
  3. Row `flex items-center justify-between px-1`:
     - "Places from OpenStreetMap" (`text-12 text-muted`).
     - `Button variant=link size=xs` "Cancel" → `onSearchOpenChange(false)` + `onQueryChange('')`. This is a deviation. Escape in the field does the same.
- **Filter** (kept as designed):
  - `q = query.trim().toLowerCase()`.
  - Results = `MORE.filter(c => c.name.toLowerCase().startsWith(q) || c.region.toLowerCase().includes(q)).slice(0, 6)`.
  - An empty `q` returns the first 6.
  - "Ind" returns Indore, Indapur, Indi, Imphal, Kochi, Kozhikode.
- **Result pick**:
  - `onChange({ id: name.toLowerCase(), name, region })`.
  - `onSearchOpenChange(false)` and `onQueryChange('')`.
  - The sheet collapses, and the picked city shows first and selected ("📍 Indore").
- Data (`cities.ts`):
  - `CIT`: blr Bengaluru, bom Mumbai, del Delhi, pnq Pune, hyd Hyderabad, maa Chennai, ccu Kolkata, amd Ahmedabad.
  - `MORE`: the 15 name/region pairs listed under "Search list `MORE`" in Part 2.

**ChoiceChipGroup** (`sheets/ChoiceChipGroup.tsx`)
```ts
interface ChoiceChipGroupProps<T extends string> {
  label: string;                         // eyebrow text and aria-label
  options: readonly { id: T; label: string }[];
  value: T | null;
  onChange(v: T | null): void;
  allowDeselect?: boolean;               // true in QuickStart; the From city strip never deselects (CityPicker allowDeselect=false)
}
```
- `role="group" aria-label={label}`, column `gap-2`.
- `Eyebrow` with `px-1`.
- Chips: `flex flex-wrap gap-1.5` of `Chip size=lg pressed` (off is outline; on is solid black with white text), `transition-colors duration-160`.
- Single-select. Pressing the selected chip clears it only when `allowDeselect` is set.

### 1.5 Message actions (D1–D3)

**Long-press → overlay (D1)**
- P3-9 binds `useLongPress` (500ms, cancelled by movement over 8px) to every member bubble in every stage, meaning any author that is a `UserId` other than the session user.
- It does not bind to Go bubbles, system pills, cards or my own bubbles.
- When it fires:
  1. Measure the bubble row with `getBoundingClientRect()` minus the `#app-frame` rect (`useFrame()`).
  2. Set `mode='longpress'` and `msg=<id>` (replaceState).
  3. Render `LongPressOverlay` anchored to that rect.
- **Reaction `e`**:
  - `react(msgId, e)` and set mode to null.
  - Toast `You reacted ${e} to ${firstName}`, e.g. "You reacted ❤️ to Arjun".
  - A `ReactionChip` "`e` 1" appears under the bubble with the enter animation. Reacting again replaces the emoji.
  - Count: `seed.count + 1` when the seed reaction uses the same emoji, otherwise 1. The dates-talk messages have no seed reactions.
- **More** → toast "Your full emoji keyboard opens here". The overlay stays open.
- **Copy** → `navigator.clipboard.writeText(text)` (errors swallowed), mode null, toast "Message copied".
- **Backdrop or Escape** → mode null.
- **Reply** → `mode='reply'` (D2).
- **Ask Go** → `mode='askGo'` (D3).

**Reply (D2)**
- Tray banner:
  - Title `Replying to ${firstName}` ("Replying to Arjun").
  - Snippet: the message text.
  - Accent: `go`.
- Tray value: `message.replyDraft ?? ''` ("works if we leave fri night").
- Placeholder: `Reply to ${firstName}` ("Reply to Arjun").
- List bottom padding: 150.
- Send with a trimmed empty draft does nothing. Otherwise:
  1. `send(t, { quote: { author: firstName, text } })`.
  2. Mode → null. The default composer returns with its own draft untouched.
  3. My black bubble shows a `QuoteBlock` "Arjun · in, but only after 6pm fri 😭" above "works if we leave fri night".
  4. 1200ms later the Go ack appears: "Got it 👍 I’ll factor that into the plan.". Both appends smooth-scroll to the end.
  5. In `dates-talk` only, `advance('dates-asked')` follows 600ms after the ack.
- Cancel X → mode null and the tray draft is discarded.

**Ask Go (D3)**
- Tray banner:
  - Go avatar 18, then the title `Ask Go about ${firstName}’s message` ("Ask Go about Arjun’s message").
  - Snippet: the message text.
  - Accent: `ink`.
- Suggestions: `message.askGoSuggestions ?? []` ("Flights after 6 pm Fri?", "Can we leave Sat morning?", "Sum up everyone’s dates"). A tap replaces the tray value and does not send.
- Tray value starts as `''`. Placeholder: "Ask Go anything about this".
- List bottom padding: 190.
- Send:
  1. If the trimmed draft is non-empty → `send(t, { mention: true, quote: { author: firstName, text }, ack: false })`. Posting the question is a deviation.
  2. Mode → null.
  3. In `dates-talk` → `advance('dates-asked')` after 600ms, even when the draft is empty. In other stages a posted question gets the normal ack instead.
- Cancel X → mode null.

**Default composer**:
- Typed sends, voice notes and attach items all call `send(text)`.
- Sending schedules one Go ack after 1200ms. Each send resets the timer, so rapid sends produce a single ack (as designed).

Store action signatures (chat slice, P2-2):
- `send(text: string, opts?: { quote?: { author: string; text: string }; mention?: boolean; ack?: boolean /* default true */ })`
- `react(msgId: string, emoji: string)`
- `advance(trigger: TriggerId)`

### 1.6 Data bindings

| UI | Source |
|---|---|
| Trip name / avatar / tint | `trips.goa` (`name` "Goa crew", `tint` amber, `assets.illustrations.goa`) |
| Header subtitle + members | `selectChatHeader('goa')` (new): current stage's `subtitle`/`memberIds`. In kickoff it uses the variant keyed by `quickStart` (§1.3). Users come from `trips.members` |
| Fact chips | `selectChips('goa')` → `{key, emoji, label, state}`. P3-9 adds `active` (from the sheet) and `onPress` |
| Messages | `selectMessages('goa')`: seed messages of stages `0..stageIndex` filtered by `showIf`/`live`, with `chat.goa.sent` interleaved by `stage`. The reaction comes from `chat.goa.reactions[id]` merged with the seed `reaction`. The "me" bubble is `author === session.userId` |
| QuickStart open / initial | `chat.goa.quickStart === 'pending'`. `quickStartAnswers`, `fromCity` |
| From sheet initial | `chat.goa.fromCity ?? CIT.blr` |
| Dates nudge | `selectStage('goa').id === 'dates-talk'` + local timer |
| Actions | `completeQuickStart`, `dismissQuickStart`, `setFromCity`, `send`, `react`, `advance`, `ensureStage` |
| UI-only (not persisted) | `sheet`, `searchOpen`, `query`, `mode`, `modeMsgId`, `draft`, `trayDraft`, `recording`, `attachOpen`, `datesNudgeVisible` |

Additions that P2-1 and P2-2 must make to PLAN §9:
1. **`types.ts`**: `AvatarSpec`, `FrameRect`, `AttachItem`, `ComposerMode`, `BubbleMaxWidth`, `CityRef`, `Vibe`, `Spend`, `QuickStartAnswers`.
2. **`Message`**: add `showIf?: 'qs-done' | 'qs-dismissed'`, `live?: true`, `replyDraft?: string` and `askGoSuggestions?: string[]`.
3. **`ScenarioStage`**: add `headerByQuickStart?: Record<'pending'|'done'|'dismissed', { subtitle: string; memberIds: UserId[] }>`.
4. **`TriggerId`**: add `'place-asked'` (kickoff → places) and `'dates-asked'` (dates-talk → dates-poll). `'quickstart-closed'` does not advance a stage, so it is not used here.
5. **Chat slice**:
   - `fromCity: CityRef | null`.
   - `quickStartAnswers: QuickStartAnswers`.
   - Actions `completeQuickStart(answers, from)`, `dismissQuickStart()`, `setFromCity(city)`.
   - `send` gains its `opts` parameter.
   - The `'skipped'` value of `quickStart` is unused: drop it or treat it as `'dismissed'`.
6. **Selectors**: `selectChatHeader(tripId)`. `selectMessages` follows the interleaving rule in §1.3.
7. **`timing.ts`**: `LONG_PRESS_MS = 500`.
8. **PLAN §8 query params**: `mode=longpress` and `q=<query>`.

Copy:
- **`src/data/scenario/goa.ts`**:
  - Kickoff header variants and the dates-talk header: "Rahul joined", "Just created · 2 joined", "Rahul and Priya joined", "Goa · picking dates".
  - Chip labels: "Where?", "When?", "Stay?", "Budget?", "From?", "Goa".
  - Every message in §1.3, including "TAP TO REPLY", the three reply chips, "Go suggests places from the chat", "Go checked everyone’s calendars", the `dt-arjun` `replyDraft` and `askGoSuggestions`, and the Go ack "Got it 👍 I’ll factor that into the plan.".
- **`src/data/seed/cities.ts`**: `CIT` (8) and `MORE` (15).
- **`src/data/seed/copy.ts`**:
  - Header aria-labels: "Back", "Trip board", "Share trip invite".
  - Composer:
    - Accessibility: "Message" (visually hidden), "Message, or @Go", "Add", "Send", "Stop and send voice note", "Voice message".
    - Recording and voice note: "Recording… tap the mic to send", "🎤 Voice note · 0:06".
    - Attach: the 4 row labels and 4 canned sends.
  - Long-press:
    - Reactions ❤️ 😂 🔥 👍 😮 🙏 and "React {emoji}".
    - "More reactions", "Reply", "Ask Go", "Copy", "Message actions" (new).
    - Toasts: "You reacted {emoji} to {name}", "Your full emoji keyboard opens here", "Message copied".
  - Tray: "Replying to {name}", "Reply to {name}", "Ask Go about {name}’s message", "Ask Go anything about this", "Cancel".
  - Quick start:
    - "Quick start", "Help Go plan for the crew. Takes 10 seconds."
    - "WHAT VIBE?" with its 4 labels, "SPEND EACH?" with its 3 labels.
    - "TRAVELLING FROM?", "🔒 Just for your tickets", the footnote, "Done", "Not now".
  - From sheet: "Travelling from", "Where will you start your trip?", "YOUR CITY", the privacy note, "Save".
  - City picker: "Other city", "Search a city", "Search a city, state or country", "Clear search" (new), "No matches. Try a nearby bigger city.", "Places from OpenStreetMap", "Cancel" (new).
  - Share sheet strings: P2-3.

### 1.7 Deviations from the design

Each deviation is flagged in code with `// DESIGN-ASSUMPTION`.

1. **Header is standardised to 170px.** C2's H2 variant (178px, gap 8, title 60) is dropped. PLAN §12.1 #8.
2. **Bubble metrics are standardised.**
   - Every incoming bubble uses 8/14/10, gap 2 and `shadow-bubble`, including the dynamic Go ack. The design drew the ack at 10/14, gap 4, with no shadow.
   - Mine uses 10/14, gap 4, no shadow.
   - Max width is per message: member 72 · Go 76 · mine and ack 78.
   - Member bubbles use one markup and type style; Arjun's variant without letter-spacing is dropped. PLAN §12.1 #8.
3. **Dynamic messages render by author.** The design rendered every dynamic message that wasn't mine as Go.
4. **Long-press is a real gesture.** It fires after 500ms on any member bubble and anchors to that bubble's rect. The design had a fixed top of 300, showed the overlay only as the initial state, and could not reopen it. The reaction chip renders under the bubble; the design put it to the right. PLAN §12.1 #10.
5. **Sheets close back to the current chat state.**
   - QuickStart: Done → the C2 state; Not now / X / scrim → the C3 state.
   - From: Save, X and scrim leave the chat underneath as it was, including the D states.
   - The design sent every close to C3. PLAN §12.1 #11.
6. **Selections persist.**
   - Done saves vibe, spend and from. Save saves `fromCity`.
   - The From chip shows the city with a check, so C2 shows "Bengaluru ✓" where the design shows "From?".
   - A picked search city stays first in the strip.
   - The design used plain links and saved nothing. PLAN §12.1 #11.
7. **CityPicker gets a "Cancel" link and Escape to leave search mode.** The design had no way out except picking a result.
8. **Sheet geometry is expressed as height capped at frame − 96px.** QuickStart is 528, From is 465, search is the full frame − 96. This is identical to the design's top 384/447/96 on the 912px frame and keeps short phones usable.
9. **Kabir roster.** Kabir posts in `dates-talk` but is never in the header stack or the counts. PLAN §12.1 #1.
10. **Ask-Go send posts the question** as my bubble (MentionChip Go + quote of the target) before advancing to `dates-poll`. The design ignored the draft and navigated.
11. **Reply quote and exit.**
    - The quote comes from the target message instead of being hard-coded.
    - After sending, the tray closes to the default composer. The design kept the tray without its banner and quoted Arjun on every later send.
    - In `dates-talk`, the reply also advances to `dates-poll` after the ack. The design stayed on D2.
12. **Tray Cancel returns to the default composer.** The design reopened the D1 overlay.
13. **C4/C5 underlay is the real `dismissed` chat**, so it includes Priya's bubble and the nudge under the scrim. The design showed only the system pill and Go opener.
14. **The `dates-talk` fallback nudge pill** "Go checked everyone’s calendars" (2.5s) is a PLAN addition that no artboard shows.
15. **Static sheets slide in through vaul.** The design rendered them already open with no enter animation.
16. **Header chip targets follow PLAN §8.1** (`ensureStage`, sheet params) instead of linking to other artboards. Share-sheet targets use Web Share and wa.me (PLAN §7.2) instead of linking to the WA artboards.

### 1.8 Acceptance checklist

**C1**
- [ ] Preset C1 opens with the QuickStart sheet already open. On a 912px frame its top edge is at 384 (height 528). The scrim is 38% navy and covers the composer.
- [ ] The header is 170px: "Goa crew", subtitle "Rahul joined" with two 18px stacked avatars. Five unset chips appear in the order Where?, When?, Stay?, Budget?, From?.
- [ ] The list shows the system pill "Trip created · Rahul joined", then the Go bubble with the two-line opener.
- [ ] Defaults: vibe "🏖️ Beach" pressed, no spend selected, "📍 Bengaluru" pressed. Tapping a pressed vibe, spend or city chip deselects it.
- [ ] "Other city" grows the sheet to top 96. Typing "Ind" lists 6 rows. Picking Indore collapses the sheet with "📍 Indore" first and selected. "Cancel" leaves search with the selection unchanged.
- [ ] Done closes the sheet into the C2 state with the From chip "Bengaluru ✓" (or the picked city). A reload keeps it.
- [ ] Not now, X, scrim and drag-down each lead to the C3 state with nothing saved (From? stays unset).

**C2**
- [ ] Subtitle "Just created · 2 joined" with 2 avatars. The header measures exactly 170px.
- [ ] The quick-reply block is inset 38px and has the "TAP TO REPLY" eyebrow and three 40px chips: "🏖️ Beach", "⛰️ Mountains", "🤷 Not sure, suggest some".
- [ ] Any chip advances to `places`: the E1 messages append, the list scrolls to the end, and the block disappears.
- [ ] Typing swaps the mic for the send arrow. Send posts a black bubble, and 1200ms later the Go ack appears (go-soft, "Go" label) with a smooth scroll. Two quick sends produce one ack.
- [ ] Mic with an empty draft turns the button red and shows "Recording… tap the mic to send" with a pulsing dot. A second tap posts "🎤 Voice note · 0:06".
- [ ] + opens the 220px menu above the button. Each row sends its canned text and closes. Opening the menu stops recording.
- [ ] Header share opens ShareInviteSheet. Copy toasts "Invite link copied" and the sheet stays open.

**C3**
- [ ] Subtitle "Rahul and Priya joined" with 3 avatars. The system pill still reads "Trip created · Rahul joined".
- [ ] Priya's white bubble (30px avatar, muted name) "goa for diwali?? 🌴" follows the Go opener. There is no quick-reply block.
- [ ] The navy 42px nudge "Go suggests places from the chat" is centred, with a Go avatar and chevron, and fades/rises in.
- [ ] Tapping the nudge advances to `places` and the pill disappears.
- [ ] The From? chip opens the From sheet (C4).

**C4**
- [ ] While the sheet is open, the From? chip shows the 2px black ring and weight 600.
- [ ] The sheet top is at 447 (height 465 on a 912px frame). It shows "Travelling from", "Where will you start your trip?", "YOUR CITY", and a single-line strip of 8 cities bleeding to the sheet edges, with "📍 Bengaluru" selected.
- [ ] Tapping the selected city does not deselect it. Tapping another city moves the selection.
- [ ] The peach privacy note has a 16px lock and the exact copy.
- [ ] Save closes the sheet. The chip becomes "🛫 Bengaluru" (or the chosen city) with a 16px green check, and the underlying chat state is unchanged.
- [ ] X and scrim close the sheet with nothing saved. Opening the sheet from the D-state "Bengaluru ✓" chip and closing it returns to that D state.

**C5**
- [ ] `?sheet=from&q=Ind` opens the sheet expanded (top 96) with "Other city" hidden. The field has a 1.5px ink border and the value "Ind".
- [ ] Results appear in order: Indore, Indapur, Indi, Imphal, Kochi, Kozhikode, with region lines verbatim. No row is highlighted.
- [ ] Clear empties the query and still lists the first 6 `MORE` entries. "zzz" shows "No matches. Try a nearby bigger city."
- [ ] Picking Kochi collapses the sheet to 465 with "📍 Kochi" first and selected. Save then makes the chip "Kochi ✓".
- [ ] Cancel collapses the sheet, clears the query and keeps the selection. "Places from OpenStreetMap" sits under the card.

**D1**
- [ ] Preset D1 shows subtitle "Goa · picking dates" with 4 avatars (no Kabir) and chips Goa ✓, When?, Stay?, Budget?, Bengaluru ✓. Messages appear in the order Priya, Kabir, Arjun.
- [ ] The overlay has a 42% scrim with a 6px blur. Above the lifted Arjun bubble (scale 1.03, at its real position) sits the reaction bar: six 42px emoji plus a grey "more". Below it is a 230px menu: Reply (reply icon), Ask Go (22px Go avatar), Copy (copy icon).
- [ ] Holding any member bubble for 500ms opens the overlay anchored to it. Releasing early, moving more than 8px or scrolling does not.
- [ ] Tapping ❤️ closes the overlay, toasts "You reacted ❤️ to Arjun" and shows "❤️ 1" under the bubble. Reacting again with 🔥 replaces it with "🔥 1".
- [ ] More toasts "Your full emoji keyboard opens here" and the overlay stays open.
- [ ] Copy puts "in, but only after 6pm fri 😭" on the clipboard and toasts "Message copied".
- [ ] Backdrop or Escape closes the overlay. 2.5s later "Go checked everyone’s calendars" appears; tapping it advances to `dates-poll`.
- [ ] The "📍 Goa ✓" chip opens the board sheet.

**D2**
- [ ] The tray is white with a 22px top radius. Its banner has a 3px terracotta rule, "Replying to Arjun" and the snippet with ellipsis. The grey input is prefilled with "works if we leave fri night" (placeholder "Reply to Arjun"). There is a black 48px send button and no + or mic. The list bottom padding is 150.
- [ ] Send posts a black bubble with the quote "Arjun · in, but only after 6pm fri 😭" above the text, and the tray returns to the default composer.
- [ ] At +1200ms the Go ack appears. At about +1800ms the dates-poll Go message and poll card append, and the list scrolls to the end.
- [ ] Sending an empty draft does nothing. Cancel returns to the default composer with no message posted.

**D3**
- [ ] The banner has an ink rule, an 18px Go avatar, "Ask Go about Arjun’s message" and the snippet. Below it is a scrollable row of three 36px suggestion chips, then an empty grey input (placeholder "Ask Go anything about this"). The list bottom padding is 190.
- [ ] A chip tap replaces the input text without sending; chips have no pressed state.
- [ ] Sending with text posts my bubble (MentionChip "Go" + quote) and closes the tray. 600ms later the `dates-poll` messages appear.
- [ ] Sending with an empty input advances to `dates-poll` without posting anything. Cancel returns to the default composer.

### 1.9 Consumed by tasks

- **P2-5 Chat shell composites** (opus). It owns every `chat/*` file named in §1.2: ChatHeader, FactChipRow, MessageList, useScrollToEnd, SystemPill, Bubble, GoBubble, QuoteBlock, QuickReplyBlock, NextStepPill, Composer, MicSendButton, AttachMenu, RecordingPill, ComposerTray, LongPressOverlay, useLongPress, InChatCard, HorizontalRail. It implements §1.2 and the gesture contract in §1.5. It relies on:
  - P1-1 `Button` (primary, white, ghost, soft, navy, danger, link; sizes icon, icon-lg, icon-2xs, icon-xs, xl, base, xs; asChild).
  - P1-1 `Chip` (md, lg, xs; outline, active, solid via `pressed`, dashed; `emoji`, `check`).
  - P1-2 `Avatar` (18/20/22/30/44; go and trip kinds), `AvatarStack`, `CheckBadge`.
  - P1-3 `Input` (pill, pill-grey).
  - P1-5 `DropdownMenu`, `MenuItem` (default and `wide`; usable standalone), `FadeDock`, `Eyebrow`.
  - P0-2 generated icons ArrowLeft, ArrowRight, Board, Share, Plus, X, Reply, Copy, ChevronRight, and custom `LiveDot`, `MicSendIcon`.
  - P2-3 `ReactionChip`, `MentionChip`.
  - `lib/toast.ts`.
- **P3-3 Quick start + From city sheets** (sonnet). It owns `sheets/QuickStartSheet.tsx`, `FromCitySheet.tsx`, `CityPicker.tsx`, `ChoiceChipGroup.tsx` and implements §1.4. The components are props-only and must not import the store. They rely on:
  - P1-5 `BottomSheet` + `SheetHeader`/`SheetBody`/`SheetFooter`, `Card` (outline), `InfoNote`, `Eyebrow`.
  - P1-1 `Chip` (lg, dashed, pressed) and `Button` (xl primary, link, soft icon-xs).
  - P1-3 `SearchField`/`Input shape=search`.
  - P1-2 `EmojiTile` (needs size 34).
  - Icons Search, X, Lock.
  - Data from P2-1: `cities.ts`, `copy.ts`.
- **P3-9 Chat page** (opus). It owns the page, `ChatScreen`, `MessageRenderer`, `useChatSheets` and `useComposerModes`. It implements:
  - §1.1: query ↔ state, QuickStart auto-open, presets C1–D3.
  - §1.3: stage rendering and the dates nudge timer.
  - §1.5: mode state machine, timers, toasts, clipboard.
  - The §1.6 wiring.
  - MessageRenderer mappings for this group: `text` → `Bubble` (go, member or me by author), `system` → `SystemPill`, `quick-replies` → `QuickReplyBlock`, `go-nudge` → `NextStepPill`.
  - It relies on P2-1 (scenario `goa.ts`, types, timing, presets), P2-2 (the chat slice actions and selectors in §1.6), P2-3 (`ShareInviteSheet`), P2-5 and P3-3.

## 2. Inventory (reference)

# Group C + D — Trip Chat shell and 8 chat states

Source dir: `/Users/ankurshrivastava/Code/go/design/prototype/`. All 8 files read in full. The `<helmet>` CSS block (lines 1–37) is byte-identical across all 8.
Avatar blob identities, inferred from usage elsewhere in the prototype: `c58d972a…` = me/organiser (appears next to "Just me"), `cb0a34fd…` = Rahul (alt "Paid by Rahul" elsewhere), `234f094a…` = Priya, `8c7b7cb2…` = Arjun, `69bfc542…` = Kabir, `5bda4ac2…` = Go (alt "Go" elsewhere), `63e0220f…` = trip avatar (Goa crew).

---

## Chat shell (common to all)

### Global CSS (identical in all 8 files)
- Font: `font-family: 'Satoshi', 'Figtree', system-ui, sans-serif`. Only Figtree is loaded, from Google Fonts at weights 400/500/600/700/800. Satoshi is never loaded, so Figtree renders unless the device has Satoshi. Root also sets `font-kerning: normal; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased`.
- `body{margin:0}`, `a{color:#0B1B3F}`, `:root{--ease-out:cubic-bezier(0.23,1,0.32,1)}`.
- Every `a, button`: `-webkit-tap-highlight-color:transparent; touch-action:manipulation; user-select:none; -webkit-touch-callout:none; transition: transform 160ms var(--ease-out), box-shadow 180ms ease, background-color 180ms ease, opacity 180ms ease`.
- Press feedback:
  - `a:active, button:active` → `transform: scale(0.97)`. On :active the transition durations change to 160/60/60/60ms.
  - Black-filled controls (`[style*="background: #000000"]`) on :active → `box-shadow: inset 0 0 0 999px rgba(255,255,255,0.18)`, a white wash.
  - Light-filled controls (bg #F2F2F2 / #F4F5F7 / #F6EAE6 / #FFFFFF / transparent, excluding `.row`) on :active → `inset 0 0 0 999px rgba(11,27,63,0.07)`, a navy wash.
  - `a` with no background on :active → `opacity:0.6`.
  - `.row`: transform 160ms, border-color/box-shadow 150ms; `.row:active` → `scale(0.985)` and `background-color:#F5F6F8 !important`. Not used in this group.
  - Hover, fine pointer only: `a:hover{color:#22365F}`.
- `.tick`: transform/opacity 200ms ease-out, `@starting-style{scale(0.8); opacity:0}`. Not used in this group.
- **`.enter`** is the mount animation for every popover, toast, new message, sheet and pill: `transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out)`, `@starting-style{opacity:0; transform:translateY(6px)}`. With reduced motion, `.tick` and `.enter` fade only (opacity 150ms ease) with no transform.
- `input::placeholder{color:#4A5878}`.
- `.live` is a recording pulse: `animation: live 1600ms ease-in-out infinite`, keyframe `50%{box-shadow:0 0 0 7px rgba(22,163,74,0.12)}`. The halo is green even though it sits on a red pill. It is disabled under reduced motion.
- `[role="dialog"]>div>*{flex-shrink:0}`.

### Colour tokens observed
- Ink `#0B1B3F` (text, toast bg, nudge pill bg); secondary text `#4A5878`; tertiary/chevron `#A5ACB8`.
- App bg `#F6F7F9`; card/white `#FFFFFF`; hairline `#ECEFF3`; chip border `#DDE1E6` (also the grabber colour); input/secondary button fill `#F4F5F7`.
- Primary button `#000000`; recording/danger `#B42318`; success check `#16A34A`; selected search-result row `#F0FAF3`.
- Go accent (terracotta) `#A44F3A`; Go bubble `#F6EAE6`; quote rule on black `#F0C9BC`; privacy note bg `#FFF6F2`.
- Go avatar bg `#DCEBFF`; trip avatar bg `#FFF1DC`; WhatsApp `#25D366`.
- Scrim `rgba(11,27,63,0.38)`; long-press scrim `rgba(11,27,63,0.42)` + `blur(6px)`.

### Outer frame
`position:relative; width:420px; height:912px; display:flex; flex-direction:column; background:#F6F7F9; color:#0B1B3F; overflow:hidden`. There is no status-bar artwork. The safe area is the header's 56px top padding. Bottom safe area is the 24px bottom padding of the composer.

### Header (`flex-shrink:0; position:relative; z-index:2`)
- Container: `padding: 56px 0 12px; background:#FFFFFF; box-shadow: 0 1px 0 rgba(11,27,63,0.04), 0 6px 16px rgba(11,27,63,0.06)`.
- **Row** (`display:flex; align-items:center`). There are two variants:
  - **H1** (7 of 8 files): `gap:4px; padding:0 8px 0 12px`. The title link is `height:52px; padding:0 4px`. Total header = 56+52+14+36+12 = **170px**.
  - **H2** (GoA only): `gap:8px; padding:0 12px`. The title link is `height:60px; padding:0 8px 0 0`. The subtitle text also gets `letter-spacing:0.002em; line-height:1.35`. Total header = **178px**.
- **Back**: `<a href="P-TripHome-Zero.dc.html" aria-label="Back">`, 44×44, radius 999, color #000000, centred. Icon is an SVG at 22px, stroke 2, round caps/joins, `currentColor`: left arrow `M19 12H5` + `M11 6l-6 6 6 6`.
- **Title block**: `<a href="P-TripHome-Zero.dc.html">`, `flex:1; min-width:0; display:flex; align-items:center; gap:10px; background:transparent`.
  - Trip avatar: span 44×44, radius 999, bg `#FFF1DC`, overflow hidden, centred. Inside is an `<img src="/_blob/63e0220f3d27d3795e1836f5d29b07d1" alt="">` at 40×40.
  - Text column (`flex:1; min-width:0; gap:2px`):
    - Title "Goa crew": 16px/600, ls −0.011em, lh 1.25.
    - Subtitle row (`display:flex; align-items:center; gap:6px; min-width:0`):
      - **Avatar stack**: wrapper `display:flex; padding-left:5px`. Each img is 18×18, radius 999, `object-fit:cover`, `box-sizing:border-box`, `border:1.5px solid #FFFFFF`, `margin-left:-5px` (overlap).
      - Status text: 13px #4A5878, nowrap, ellipsis.
- **Trip board**: `<a href="P-Board-Zero.dc.html" aria-label="Trip board">`, 44×44, #000. SVG 20px, stroke 2: `rect x4 y3 w16 h18 rx3` + `M8 8h8`, `M8 12h8`, `M8 16h5`, a document/list icon.
- **Share invite**: `<a role="button" tabindex="0" aria-label="Share trip invite">`, 44×44, #000. It opens the share sheet. SVG 20px, stroke 2: `M14 5l7 7-7 7` + `M21 12h-9a8 8 0 0 0-8 8`, a forward/share arrow.
- **Trip-facts chip row** under the header row: `margin-top:14px; display:flex; gap:8px; padding:0 20px; overflow-x:auto; scrollbar-width:none; overscroll-behavior-x:contain`.
  - **Header chip**: `<a>`, `height:36px; padding:0 14px; flex-shrink:0; box-sizing:border-box; display:flex; align-items:center; gap:5px; border-radius:999px; background:#FFFFFF; border:1px solid #DDE1E6; color:#0B1B3F; font-size:14px; font-weight:500; white-space:nowrap; letter-spacing:-0.004em; line-height:1.35`.
  - Leading emoji span: `width:16px; flex-shrink:0; display:flex; justify-content:center; font-size:14px; line-height:1`, `aria-hidden`.
  - **States**:
    - *Unset*: label is a question.
      - 📍 Where? → `P-Chat-DestSuggest.dc.html`
      - 📅 When? → `P-Chat-DatesPoll.dc.html`
      - 🏡 Stay? → `P-Chat-StaySuggest.dc.html`
      - 💰 Budget? → `P-Chat-BudgetSheet-Slider.dc.html`
      - 🛫 From? → `P-Chat-FromSheet.dc.html`
    - *Set*: label is the value, followed by a trailing **green check badge**: span 16×16, radius 999, bg `#16A34A`, color #FFF, centred, containing SVG 9px, stroke **4**, `M5 12l5 5 9-10`.
      - In D1–D3, "📍 Goa ✓" links to `P-Board-Zero.dc.html` instead of DestSuggest.
      - In D1–D3, "🛫 Bengaluru ✓" still links to FromSheet.
    - *Active*, while its sheet is open (FromSheet/CitySearch "From?"): `border:1px solid #000000; box-shadow:0 0 0 1px #000000` (a 2px black ring) and `font-weight:600`.
  - Chip order is always Where/When/Stay/Budget/From.

### Message list
- Scroller: `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; display:flex; flex-direction:column`.
- Inner: `padding:16px 16px 96px; display:flex; flex-direction:column; gap:10px`. The bottom padding matches the composer: 96px default, 150px in Reply, 190px in AskGo.
- **System event pill** ("Trip created · Rahul joined"):
  - `align-self:center; margin:2px 0; display:flex; align-items:center; gap:6px; padding:5px 12px 5px 5px; border-radius:999px; background:#FFFFFF`.
  - `box-shadow:0 1px 2px rgba(11,27,63,0.06), 0 4px 12px rgba(11,27,63,0.04)` (the "bubble shadow").
  - `color:#4A5878; font-size:13px; letter-spacing:0.002em; line-height:1.35`.
  - Leading Go avatar img 20×20, radius 999, bg #DCEBFF.
- There are **no date separators, timestamps, read receipts, typing indicators or "new messages" dividers** in any of the 8 artboards.

### Message bubble variants
All rows use `display:flex; align-items:flex-end; gap:8px`. Avatars are 30×30, radius 999, `object-fit:cover`. Go's avatar adds `background:#DCEBFF`.

1. **Go bubble (static seed)**
   - Avatar is the Go img (`5bda4ac2…`).
   - Bubble: `max-width:76%; padding:8px 14px 10px; border-radius:20px 20px 20px 0; background:#F6EAE6; box-shadow:<bubble shadow>; display:flex; flex-direction:column; gap:2px`.
   - Sender label "Go": 13px/600, **#A44F3A**, ls 0.002em, lh 1.35.
   - Body: 16px, ls −0.011em, lh 1.4, `text-wrap:pretty`. `<br>` is allowed.
2. **Human, other member (static seed)**, white not pink. Two markup forms with the same look:
   - (a) Priya and Kabir: avatar plus a wrapper `display:flex; flex-direction:column; align-items:flex-start; max-width:72%`. Inside is the bubble: `padding:8px 14px 10px; border-radius:20px 20px 20px 0; background:#FFFFFF; box-shadow:<bubble shadow>; column; gap:2px`. Name is 13px/600 **#4A5878**, ls 0.002em, lh 1.35. Body is 16px, ls −0.011em, lh 1.4.
   - (b) Arjun: the bubble itself has `max-width:72%` with no wrapper. Name is 13px/600 #4A5878 with no ls/lh. Body is 16px, lh 1.4, no ls. A reaction pill can follow as a flex sibling.
3. **Mine (dynamic `pSent`, `me:true`)**
   - Row `justify-content:flex-end`, no avatar.
   - Bubble: `max-width:78%; padding:10px 14px; display:flex; flex-direction:column; gap:4px; border-radius:20px 20px 0 20px; background:#000000; color:#FFFFFF`. **No shadow.**
   - Optional **reply-quote block** above the text: `padding:6px 10px; border-radius:10px; background:rgba(255,255,255,0.14); border-left:3px solid #F0C9BC; font-size:13px; line-height:1.35`. Text format is `"<Sender> · <quoted text>"`.
   - Text: 16px, ls −0.011em, lh 1.4.
4. **Go reply (dynamic `pSent`, `me:false`)**
   - Row `justify-content:flex-start`, with Go avatar 30px (#DCEBFF).
   - Bubble: `max-width:78%; padding:10px 14px; gap:4px; border-radius:20px 20px 20px 0; background:#F6EAE6; color:#0B1B3F`, no shadow.
   - Label "Go" is 13px/600 #A44F3A with no ls/lh.
   - The mock maps every non-me message to Go (`go: !m.me`).
- Every dynamic row has class `.enter`, so it slides up 6px and fades in.
- **Reaction pill** (D1, after reacting):
  - `<span class="enter">` placed as the next flex sibling after Arjun's bubble in the same row, so it sits to the **right** of the bubble, bottom-aligned.
  - Style: `margin:-6px 0 0 10px; padding:2px 8px; border-radius:999px; background:#FFFFFF; border:1px solid #ECEFF3; font-size:13px; font-weight:600; display:inline-flex; align-items:center; gap:3px`.
  - Text: `"{emoji} 1"`.

### Go message card anatomy (as present in this group)
None of these 8 artboards contains a rich Go card with a header, action buttons or a "Just for you" footer. Go appears only as:
- the pink Go bubble described above (avatar 30px #DCEBFF, label "Go" #A44F3A);
- a **"TAP TO REPLY" quick-reply block** under Go's bubble (C2);
- a **Go nudge pill** (C3);
- the **Ask Go composer banner + suggestion chips** (D3);
- an **"Ask Go" row** with a 22px Go avatar in the long-press menu (D1).

The phrase "Just for …" appears only as the QuickStart sheet label "🔒 Just for your tickets", described under C1.

### Quick-reply suggestion chips
- **Tap-to-reply block (C2)**:
  - Container `margin-left:38px` (30px avatar + 8px gap, aligning to the bubble edge); `display:flex; flex-direction:column; gap:8px`.
  - Eyebrow "TAP TO REPLY": 11px/700 #4A5878, ls 0.08em, lh 1.35.
  - Chip wrap: `flex-wrap:wrap; gap:8px`.
  - **Reply chip**: `<a>`, `height:40px; padding:0 14px; display:inline-flex; align-items:center; border-radius:999px; background:#FFFFFF; border:1px solid #DDE1E6; color:#0B1B3F; font-size:14px; font-weight:600; white-space:nowrap`. Emoji is inline in the label.
- **Ask Go suggestion chip (D3)**:
  - Row `display:flex; gap:6px; overflow-x:auto; scrollbar-width:none`, inside the composer tray.
  - Chip: `<a role="button" tabindex="0">`, `height:36px; padding:0 12px; flex-shrink:0; inline-flex; radius 999; bg #FFFFFF; border:1px solid #DDE1E6; 13px/600; nowrap`.
  - Tapping fills the input; it does not send.
- **Go nudge pill (C3)**:
  - `<a class="enter">`, `align-self:center; margin-top:6px; height:42px; padding:0 14px 0 6px; display:flex; align-items:center; gap:8px; border-radius:999px; background:#0B1B3F; color:#FFFFFF; font-size:14px; font-weight:600; box-shadow:0 6px 18px rgba(11,27,63,0.2)`.
  - Contents: Go avatar img 30×30 #DCEBFF, then the text, then a chevron SVG 14px, stroke **2.6**, `M9 6l6 6-6 6`.

### Composer, default variant (C1–C5, D1)
- Bar: `position:absolute; left:0; right:0; bottom:0; padding:24px 16px 24px; display:flex; align-items:center; gap:10px; background:linear-gradient(180deg, rgba(246,247,249,0) 0%, #F6F7F9 35%)`. It is transparent at the top and fades into the bg. Total height is 96px.
- **Add (+)**: `<button aria-label="Add" aria-expanded="{{pAttachExp}}">`, 48×48, radius 999, bg #FFFFFF, color #000, `box-shadow:0 1px 3px rgba(0,0,0,0.08)`. SVG 20px, stroke 2, plus `M12 5v14` + `M5 12h14`.
- **Input pill**: `<label for="msg">`, `flex:1; height:48px; padding:0 16px; display:flex; align-items:center; border-radius:999px; background:#FFFFFF`. It has no border or shadow.
  - Visually-hidden span "Message" (`position:absolute; 1px; clip`).
  - `<input id="msg" type="text" placeholder="Message, or @Go">`: `flex:1; min-width:0; border:0; outline:none; bg transparent; font-size:16px; ls −0.011em; color #0B1B3F`. It is bound to `pDraft` with `onChange=pOnDraft`.
- **Mic/Send** (`{{pMicStyle}}`): `width:48px; height:48px; flex-shrink:0; border:0; border-radius:999px; color:#FFFFFF; centred`. Background is `#000000`, or `#B42318` while recording.
  - Icon when the draft is non-empty: **send arrow**, SVG 20px stroke 2, `M5 12h14` + `M13 6l6 6-6 6`.
  - Icon when the draft is empty: **mic**, `rect x9 y3 w6 h11 rx3` + `M5 11a7 7 0 0 0 14 0` + `M12 18v3`.
  - aria-label: "Send" (draft) / "Stop and send voice note" (recording) / "Voice message".
- **Attach popover** (`pAttach`):
  - `.enter`, `position:absolute; left:16px; bottom:84px; width:220px; border-radius:18px; background:#FFFFFF; box-shadow:0 10px 30px rgba(11,27,63,0.22); overflow:hidden`.
  - Four rows, each a `<button>` with `width:100%; height:48px; padding:0 14px; display:flex; gap:12px; 15px/600 #0B1B3F; text-align:left`. Rows 2–4 add `border-top:1px solid #ECEFF3`. Leading emoji at 18px.
  - Rows: 📷 Photo / 📄 Ticket or PDF / 📍 Location / 🗳️ Poll.
- **Recording pill** (`pRec`):
  - `.enter`, `position:absolute; right:16px; bottom:84px; height:40px; padding:0 14px; border-radius:999px; background:#B42318; color:#FFF; 14px/600; gap:8px`.
  - Leading `.live` dot 8×8, white, radius 999.
  - Text: "Recording… tap the mic to send".
- **Composer logic** (same in all files that have it):
  - `pMic`:
    - If the draft is non-empty after trimming → `_send(draft)` and clear `pDraft`.
    - Else if recording → `pRec=false` and `_send('🎤 Voice note · 0:06')`.
    - Else → `pRec=true, pAttach=false`.
  - `pToggleAttach` → `pAttach=!pAttach, pRec=false`.
  - `pAttach_0..3` close the popover and send:
    - "📷 Photo · Goa packing list"
    - "📄 Shared a PDF · IndiGo e-ticket"
    - "📍 Shared location · Anjuna"
    - "🗳️ Poll · Scuba on Sunday? Yes / No"

### Composer, tray variant (D2 Reply, D3 Ask Go)
- Tray: `position:absolute; left:0; right:0; bottom:0; padding:10px 16px 24px; display:flex; flex-direction:column; gap:8px; background:#FFFFFF; box-shadow:0 -1px 0 rgba(11,27,63,0.06), 0 -8px 24px rgba(11,27,63,0.08); border-radius:22px 22px 0 0`.
- **Context banner**:
  - `padding:8px 8px 8px 12px; display:flex; align-items:center; gap:10px; border-radius:14px; background:#F4F5F7; border-left:3px solid <accent>`.
  - Accent is **#A44F3A** for Reply and **#0B1B3F** for Ask Go.
  - Text column (`flex:1; min-width:0; gap:1px`):
    - Title: 13px/700, colour = accent.
    - Snippet: 14px #4A5878, nowrap, ellipsis.
  - Cancel X: `<a aria-label="Cancel">`, 32×32, radius 999, color #4A5878. SVG 14px, stroke 2, `M6 6l12 12` + `M18 6L6 18`.
- Optional suggestion chip row (Ask Go only).
- Input row (`display:flex; align-items:center; gap:10px`):
  - Input pill: `flex:1; height:48px; padding:0 16px; radius 999; background:#F4F5F7` (grey, not white). Input is 16px with no letter-spacing.
  - Send button: 48×48, radius 999, bg #000, color #FFF, always shows the send arrow.
  - **There is no Add (+) and no mic.**

### Scroll-to-bottom logic (`_send(t, quote)`, identical everywhere)
1. Appends `{t, me:true, quote: quote||''}` to `state.pSent`.
2. After `setTimeout(60ms)`, calls `document.querySelector('[data-p-end]').scrollIntoView({behavior:'smooth', block:'end'})`, wrapped in try/catch.
3. Clears `this._pg` and starts a new 1200ms timeout. When it fires, it appends `{t:'Got it 👍 I’ll factor that into the plan.', me:false}`, the Go auto-ack, and scrolls again after 60ms.
- Because the timer is cleared on each send, rapid sends produce only one ack.
- `[data-p-end]` is `<span data-p-end="1" style="display:block; height:1px">`, the last child of the list inner column after the `pSent` `<sc-for>`. It is present in all files **except AskGo**, which has no `pSent` loop at all.

### Toast (all 8)
- `<div class="enter" role="status">`, `position:absolute; left:50%; bottom:108px; z-index:60; transform:translateX(-50%); max-width:340px; padding:12px 16px; border-radius:16px; background:#0B1B3F; color:#FFFFFF; font-size:14px; font-weight:600; line-height:1.35; text-align:center; box-shadow:0 10px 30px rgba(11,27,63,0.3)`.
- `_toast(t)` sets `pT`; `clearTimeout(_pt)`; auto-hides after **2200ms**.

### Generic bottom-sheet pattern
- **Scrim**: `position:absolute; inset:0; background:rgba(11,27,63,0.38)`.
  - Static sheets (C1, C4, C5) use `<a href=… aria-label="Close sheet">` at z-index 5. Tapping it navigates.
  - The share sheet uses `<button aria-label="Close">` inside a z-index 40 wrapper. Tapping it sets state.
- **Sheet**: `position:absolute; left:0; right:0; bottom:0; display:flex; flex-direction:column; border-radius:28px 28px 0 0; background:#F6F7F9; box-shadow:0 -8px 30px rgba(11,27,63,0.18)`.
  - Static tall sheets set `top` and `height` explicitly and use z-index 6.
  - The share sheet is content-height with `padding:8px 16px 30px; gap:14px` and class `.enter`.
  - The static sheets have **no** `.enter`; they render already open.
- **Grabber**: `<span aria-hidden>`, `align-self:center; width:40px; height:5px; border-radius:999px; background:#DDE1E6`. Tall sheets add `margin-top:8px`.
- **Scroll body** (tall sheets): `flex:1; min-height:0; overflow-y:auto; scrollbar-width:none; padding:8px 16px <150|120>px; display:flex; flex-direction:column; gap:12px`.
- **Title block**: `padding:0 4px; column; gap:2px`.
  - Row `justify-content:space-between; gap:12px`.
  - Title: 22px/600, ls −0.02em, lh 1.3.
  - **Close X**: `<a aria-label="Close">`, 40×40, `margin-right:-6px`, radius 999, bg #FFFFFF, color #0B1B3F, `box-shadow:0 1px 3px rgba(0,0,0,0.08)`. SVG 18px X, stroke 2.
  - Subtitle: 14px #4A5878, ls −0.004em, lh 1.4, `text-wrap:pretty`.
- **Section eyebrow**: 11px/700 #4A5878, ls 0.08em, lh 1.35, uppercase copy, `padding:0 4px`.
- **Footer**: `position:absolute; left:0; right:0; bottom:0; padding:40px 16px 24px; display:flex; flex-direction:column; align-items:stretch; gap:10px`, with the same transparent→#F6F7F9 35% gradient as the composer.
  - **Primary CTA**: `<a>`, `height:56px; padding:0 18px; centred; gap:8px; border-radius:999px; background:#000000; color:#FFFFFF; font-size:18px; font-weight:500; ls −0.014em; lh 1.3; nowrap`.
  - **Secondary text button**: `height:44px; centred; color:#A44F3A; 16px/600`.
- **Choice chip** (single-select pill button, `aria-pressed`): `height:40px; padding:0 14px; border-radius:999px; font-size:14px; font-weight:600`.
  - Off: `background:#FFFFFF; color:#0B1B3F; border:1px solid #DDE1E6`.
  - On: `background:#000000; color:#FFFFFF; border:0`.
  - Group chips add `transition: background-color 160ms ease, color 160ms ease`.
  - City chips add `flex-shrink:0; white-space:nowrap`, and when on the label is prefixed with "📍 ".
- **"Other city" dashed chip**: `<button>`, `height:40px; padding:0 14px; inline-flex; gap:6px; radius 999; background:#FFFFFF; border:1px dashed #A5ACB8; 14px/600 #0B1B3F`. Leading search SVG 16px: `circle cx11 cy11 r7` + `M20 20l-3.5-3.5`. Wrapped in a `display:flex` div so it sits on its own line.
- **City search field**: `<label for="city">`, `height:52px; padding:0 8px 0 16px; display:flex; gap:10px; border-radius:16px; background:#FFFFFF; border:1.5px solid #0B1B3F` (focused look, always shown).
  - Search icon: 18px, #4A5878.
  - Visually-hidden "Search a city".
  - `<input id="city" type="search" placeholder="Search a city, state or country">` at 16px.
  - Clear button: 36×36, radius 999, bg #F4F5F7, color #4A5878, X icon 14px.
- **Results card**: `padding:0 12px; border-radius:18px; background:#FFFFFF; border:1px solid #ECEFF3`.
  - Each row is a `<button aria-pressed>`: `width:100%; padding:10px 4px; border:0; display:flex; gap:12px; text-align:left`. bg is `#F0FAF3` if it is the picked city, else transparent. Rows from index 1 get `border-top:1px solid #ECEFF3`.
  - Row contents: pin badge 34×34 radius 999 #F4F5F7 with 📍 at 15px; name 16px/600; region 13px #4A5878 (column gap 1px).
  - Empty state: "No matches. Try a nearby bigger city." (`padding:16px 4px; 13px #4A5878`).
  - Below the card: attribution "Places from OpenStreetMap" (12px #4A5878, padding 0 4px).
- **Share-invite sheet**: present in all 8 files, opened by the header share icon. Full anatomy:
  - Wrapper `position:absolute; inset:0; z-index:40`. Backdrop `<button aria-label="Close">` rgba(11,27,63,0.38) closes it.
  - Dialog: `role="dialog" aria-label="Share trip invite" class="enter"`.
  - Invite card: `padding:12px; border-radius:18px; bg #FFF; border:1px solid #ECEFF3; gap:12px`.
    - Img `63e0…` 44×44, radius 12, bg #FFF1DC.
    - "Join Goa crew on Go" (15px/600).
    - "go.vestra.ai/t/goa-k7q" (13px #4A5878).
    - **Copy** button: 36px tall, padding 0 12, radius 999, bg #F4F5F7, 13px/600. Toast "Invite link copied"; the sheet stays open.
  - Recent-group row: `<a href="P-WA-Compose.dc.html">`, `padding:10px 12px; radius 18; bg #FFF; border #ECEFF3; gap:12px`.
    - Avatar 44×44 circle #FFF1DC with 🌴 at 20px.
    - WhatsApp dot badge: 18×18 #25D366, `border:2px solid #FFF`, at right −2 / bottom −2.
    - "Goa crew 🌴" (15px/600) / "WhatsApp group · recent" (13px #4A5878).
    - Chevron SVG 16px, stroke **2.4**, #A5ACB8.
  - Targets row (`justify-content:space-between`): 5 items, each 64px wide, column, gap 6px. Tile is 56×56, radius 18, `border:1px solid #ECEFF3`, font 24px. Label is 12px/600.
    - **WhatsApp**: tile bg #25D366 with a white speech-bubble SVG 28px, stroke 2, `M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z`. Links to `P-WA-Pick.dc.html`.
    - **💬 Messages** → toast "Opens Messages with the link filled in", then close.
    - **✉️ Gmail** → toast "Opens Gmail with the link filled in", then close.
    - **🔗 Copy link** → toast "Invite link copied", then close.
    - **⋯ More** → toast "Opens your phone’s share menu", then close.

### Z-index stack
- Header: 2
- Static sheet scrim: 5 / long-press overlay scrim: 5
- Static sheet / long-press content: 6
- Share sheet: 40
- Toast: 60

The composer has no z-index; it sits above the list by DOM order.

### DCLogic skeleton (shared)
- `class PBase extends DCLogic` holds screen-specific seeds.
- `class Component extends PBase`:
  - Constructor merges `{pT:null, pShare:false, pSent:[]}` plus per-screen extras.
  - Methods: `_toast`, `_send`.
  - `renderVals()` returns `pToast`, `pToastText`, `pShare`, the `pSent` mapping (`t`, `go`, `hasQuote`, `quote`, `row`, `bubble` style strings) and the share handlers `pa_N`. Handler indices shift per file.
- Implicit state keys, undefined until used: `pDraft`, `pRec`, `pAttach`, `cSearch`, `cQ`, `cPicked`, `lpReact`, `rpDone`.
- Template bindings use `{{x}}`, `<sc-for list as hint-placeholder-count>` and `<sc-if value hint-placeholder-val>`.

---

## P-Chat-QuickStart.dc.html — C1 Quick start: cities in one line, Other city searches inline
`<title>Go — Quick start sheet</title>`

### Purpose (1 line)
First open of a new trip chat: the Quick start bottom sheet collects vibe, spend and departure city over the chat, which is still mostly empty.

### What differs from the shell / sibling screens
- Header H1. Subtitle "Rahul joined" with **2** stacked avatars (me `c58d…`, Rahul `cb0a…`). All 5 header chips are unset.
- List contains only the system pill and Go's opener.
- A tall **Quick start sheet** covers the bottom of the screen. It shares its city-picker sub-component with C4/C5.
- The composer is rendered but sits under the scrim, so it is not reachable.

### Layout top→bottom (only screen-specific parts, with exact styles)
1. Header (170px) and list: system pill "Trip created · Rahul joined", then the Go bubble "What’s the plan, crew? 🌴⏎Where are we thinking of going?".
2. Default composer, under the scrim.
3. Scrim: `<a href="P-Chat-Dismissed.dc.html" aria-label="Close sheet">`, inset 0, z 5, rgba(11,27,63,0.38).
4. `role="dialog" aria-label="Quick start"`, style `{{cDlg}}`:
   - Collapsed: `top:384px; height:528px` (to the bottom edge).
   - Search open (`cSearch`): `top:96px`, no height, so the sheet grows to 816px and covers almost all of the header.
   - Both: z 6, radius 28/28/0/0, bg #F6F7F9, shadow `0 -8px 30px rgba(11,27,63,0.18)`.
   - Grabber (margin-top 8).
   - Scroll body `padding:8px 16px 150px; gap:12px`:
     - Title row "Quick start" plus close X → Dismissed. Subtitle "Help Go plan for the crew. Takes 10 seconds."
     - `<sc-for groups>`: each `role="group" aria-label={{g.q}}`, column gap 8. Eyebrow `{{g.q}}`. Chips `flex-wrap:wrap; gap:6px` of choice chips.
     - Group "Travelling from" (`role=group`):
       - Header row `justify-content:space-between; padding:0 4px`. Left eyebrow "TRAVELLING FROM?". Right "🔒 Just for your tickets" (12px/600 #4A5878).
       - City chip strip: `margin:0 -16px; padding:0 16px; display:flex; gap:6px; overflow-x:auto; scrollbar-width:none` (single line, bleeds to the sheet edges).
       - `cCollapsed` → "Other city" dashed chip.
       - `cSearching` → `.enter` column gap 10: search field, results card, OSM attribution.
     - Footnote: "Skip anything. You can set where you’re travelling from anytime with the From chip up top." (13px #4A5878, ls 0.002em, lh 1.35, padding 0 4px).
   - Footer (gradient):
     - **Done**: primary black 56px → `P-Chat-GoA.dc.html`.
     - **Not now**: text button #A44F3A → `P-Chat-Dismissed.dc.html`.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- **Quick start sheet**: open on load (static, no `.enter`).
  - Size: 420×528 at top 384. With search open: top 96, 816 tall.
  - Backdrop: navy 38%, links to Dismissed.
  - Ways to close, all navigating to Dismissed: X, scrim, "Not now". **Done** goes to GoA.
- **Share sheet**: header share icon. It sits under the scrim, so it is unreachable in this state, but it exists in code.
- **Attach popover / recording pill / toast**: shell behaviour. The composer is covered by the scrim.

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- PBase state: `{vibe:'beach', spend:null, from:'blr'}`.
- Component adds `{pT:null, pShare:false, pSent:[]}`.
- Groups `G`:
  - `vibe` "WHAT VIBE?": beach "🏖️ Beach", hills "⛰️ Hills", city "🏙️ City", any "🤷 Surprise us".
  - `spend` "SPEND EACH?": lt15 "Under ₹15k", 15to25 "₹15–25k", gt25 "₹25k+".
- `mk(key)` returns `{label, pressed, style, pick}`. `pick` toggles: tapping the selected chip sets it back to `null` (deselect). Single-select per group.
- PBase also computes `froms` (Bengaluru/Mumbai/Delhi). It is **unused** by the template, which is a leftover.
- City picker, with `cKey='from'`:
  - `CIT` = blr Bengaluru, bom Mumbai, del Delhi, pnq Pune, hyd Hyderabad, maa Chennai, ccu Kolkata, amd Ahmedabad.
  - `cList` = `[cPicked]` prepended to CIT when a searched city is picked.
  - `cCities[i].pick` → `setState({from: on && cKey==='from' ? null : id})`. Tapping the selected city **deselects** it.
  - Label is `'📍 '+label` when on.
- Search:
  - `cOpen` → `{cSearch:true, cQ: cQ ?? ''}`.
  - `cOnQ` → `cQ = e.target.value`.
  - `cClear` → `cQ=''`.
  - `cRes = MORE.filter(n startsWith q OR region contains q).slice(0,6)`.
  - `cNone` = no results.
  - Result `pick` → `{cPicked:n, from:n.toLowerCase(), cSearch:false, cQ:''}`. The sheet collapses back to 528px and the picked city appears as the first chip, selected ("📍 Indore").
  - There is **no cancel for search mode** other than picking a result.
- Derived: `cSearching = !!cSearch`, `cCollapsed = !cSearch`, `cDlg` style string.
- The chip selections are **not persisted or passed on**. "Done" is a plain link to GoA.
- Composer, share and toast handlers are as in the shell: `pa_0` opens share; `pa_1..4` targets; `pa_5` closes; `pa_6` copies.

### Navigation table: element → target file
| Element | Target |
|---|---|
| Back arrow, title block | P-TripHome-Zero.dc.html |
| Trip board icon | P-Board-Zero.dc.html |
| Chip Where? / When? / Stay? / Budget? / From? | P-Chat-DestSuggest / P-Chat-DatesPoll / P-Chat-StaySuggest / P-Chat-BudgetSheet-Slider / P-Chat-FromSheet (all under the scrim) |
| Scrim, sheet X, "Not now" | P-Chat-Dismissed.dc.html |
| "Done" | P-Chat-GoA.dc.html |
| Share sheet: recent group row / WhatsApp tile | P-WA-Compose.dc.html / P-WA-Pick.dc.html |

### Data shown (seed values)
- Header: "Goa crew", "Rahul joined".
- System pill: "Trip created · Rahul joined".
- Go: "What’s the plan, crew? 🌴" ⏎ "Where are we thinking of going?"
- Sheet: "Quick start" / "Help Go plan for the crew. Takes 10 seconds." / "WHAT VIBE?" / "SPEND EACH?" / "TRAVELLING FROM?" / "🔒 Just for your tickets".
- Vibe: 🏖️ Beach (selected), ⛰️ Hills, 🏙️ City, 🤷 Surprise us. Spend: Under ₹15k, ₹15–25k, ₹25k+ (none selected).
- Cities: 📍 Bengaluru (selected), Mumbai, Delhi, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad.
- Search list `MORE` (name — region):
  - Indore — Madhya Pradesh, India
  - Indapur — Maharashtra, India
  - Indi — Karnataka, India
  - Imphal — Manipur, India
  - Kochi — Kerala, India
  - Kozhikode — Kerala, India
  - Mangaluru — Karnataka, India
  - Mysuru — Karnataka, India
  - Nagpur — Maharashtra, India
  - Nashik — Maharashtra, India
  - Jaipur — Rajasthan, India
  - Lucknow — Uttar Pradesh, India
  - Surat — Gujarat, India
  - Dubai — Dubai, UAE
  - Singapore — Singapore
- Empty query shows the first 6.
- Footnote copy: "Skip anything. You can set where you’re travelling from anytime with the From chip up top."
- CTAs: "Done", "Not now".
- Composer canned sends plus Go ack: see the shell.

### Icons & images
- SVGs, all stroke 2, round caps: back arrow 22px; board 20px; share 20px; plus 20px; mic and send 20px; X 18px (sheet close) and 14px (clear); search 16px (Other city) and 18px (field).
- Emoji: chips 📍📅🏡💰🛫; vibe 🏖️⛰️🏙️🤷; 🌴 in Go copy; 🔒 privacy label; 📍 pin in result rows (15px) and as the selected-city prefix; attach 📷📄📍🗳️; share 💬✉️🔗⋯ and 🌴 in the group avatar.
- Images:
  - `/_blob/63e0220f…` trip avatar: 40px in the header (44px #FFF1DC circle); 44px radius 12 in the share card.
  - `/_blob/c58d972a…`, `/_blob/cb0a34fd…`: 18px avatar stack.
  - `/_blob/5bda4ac2…` Go: 20px in the system pill, 30px next to bubbles.
  - All `alt=""`.

---

## P-Chat-GoA.dc.html — C2 Go opens, variant A
`<title>Go — Trip chat · 0 Go opens · variant A (v2)</title>`

### Purpose (1 line)
The chat right after Quick start "Done": Go's opener with a "TAP TO REPLY" quick-reply block offering destination types.

### What differs from the shell / sibling screens
- **Header variant H2**: row `gap:8px; padding:0 12px`; title link `height:60px; padding:0 8px 0 0`; header 178px. Subtitle "Just created · 2 joined" (ls 0.002em, lh 1.35) with 2 avatars (me, Rahul).
- It is the only artboard in the group with the tap-to-reply chips. There is no sheet.
- PBase is empty (`renderVals(){return {}}`).

### Layout top→bottom (only screen-specific parts, with exact styles)
1. System pill "Trip created · Rahul joined".
2. Go bubble (opener, same copy as C1).
3. Quick-reply block: `margin-left:38px; column; gap:8px`.
   - Eyebrow "TAP TO REPLY" (11px/700 #4A5878, ls 0.08em).
   - Wrap row (gap 8) of 3 reply chips, each 40px tall, white, border #DDE1E6, 14px/600.
4. `pSent` loop, then `[data-p-end]`.
5. Default composer.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- Share sheet only (header share icon → `pa_0`). Attach popover and recording pill as in the shell.

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- State: `{pT:null, pShare:false, pSent:[]}`.
- Handlers:
  - `pa_0` → open share.
  - `pa_1` → toast "Opens Messages with the link filled in", then close.
  - `pa_2` → toast "Opens Gmail with the link filled in", then close.
  - `pa_3` → toast "Invite link copied", then close.
  - `pa_4` → toast "Opens your phone’s share menu", then close.
  - `pa_5` → close.
  - `pa_6` → toast "Invite link copied" (stays open).
- Composer: full default behaviour (typed send, voice note, attach). Each send triggers the Go ack after 1200ms and a smooth scroll to `[data-p-end]`.
- The quick-reply chips are plain links. They do not post a message.

### Navigation table: element → target file
| Element | Target |
|---|---|
| Back, title block | P-TripHome-Zero.dc.html |
| Board icon | P-Board-Zero.dc.html |
| Header chips | DestSuggest / DatesPoll / StaySuggest / BudgetSheet-Slider / FromSheet |
| "🏖️ Beach", "⛰️ Mountains", "🤷 Not sure, suggest some" | P-Chat-DestSuggest.dc.html (all three) |
| Share: group row / WhatsApp | P-WA-Compose / P-WA-Pick |

### Data shown (seed values)
- "Goa crew" / "Just created · 2 joined".
- System pill: "Trip created · Rahul joined".
- Go: "What’s the plan, crew? 🌴⏎Where are we thinking of going?"
- "TAP TO REPLY". Chips: "🏖️ Beach", "⛰️ Mountains", "🤷 Not sure, suggest some".
- Note the wording is "Mountains" here vs "Hills" in the C1 vibe chips.

### Icons & images
Same as the shell header and composer. Emoji 🏖️ ⛰️ 🤷 🌴. Images: trip avatar, 2 member avatars, Go avatar ×2 (20px and 30px).

---

## P-Chat-Dismissed.dc.html — C3 After skipping quick start
`<title>Go — Chat after skipping quick start</title>`

### Purpose (1 line)
The chat after "Not now" or closing a sheet: a member has replied and Go offers a "suggests places from the chat" nudge.

### What differs from the shell / sibling screens
- Header H1. Subtitle "Rahul and Priya joined" with **3** avatars (me, Rahul, Priya `234f…`).
- Adds a white Priya bubble.
- Adds the **Go nudge pill** (navy). It is always on: `pNext: true` is a constant.
- No tap-to-reply block.

### Layout top→bottom (only screen-specific parts, with exact styles)
1. System pill "Trip created · Rahul joined". This is unchanged even though Priya has joined.
2. Go opener bubble.
3. Priya row: avatar 30px `234f…`, wrapper max-width 72%, white bubble. "Priya" in #4A5878. Body "goa for diwali?? 🌴".
4. `<sc-if pNext>` Go nudge pill: `.enter`, centred, `margin-top:6px`, 42px tall, bg #0B1B3F, padding 0 14 0 6, gap 8. Contains the Go avatar 30px, then "Go suggests places from the chat", then a chevron at stroke 2.6.
5. `pSent`, then `[data-p-end]`, then the default composer.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- Share sheet (header icon, `pa_0`), attach popover, recording pill. No static sheet.

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- State: `{pT:null, pShare:false, pSent:[]}`. Derived `pNext:true` (hard-coded).
- Share handlers `pa_0..6` are identical to GoA.
- Composer behaviour is as in the shell.

### Navigation table: element → target file
| Element | Target |
|---|---|
| Back, title | P-TripHome-Zero.dc.html |
| Board icon | P-Board-Zero.dc.html |
| Header chips | DestSuggest / DatesPoll / StaySuggest / BudgetSheet-Slider / FromSheet |
| Go nudge pill | P-Chat-DestSuggest.dc.html |
| Share group row / WhatsApp | P-WA-Compose / P-WA-Pick |

### Data shown (seed values)
- "Goa crew" / "Rahul and Priya joined".
- System pill: "Trip created · Rahul joined".
- Go: "What’s the plan, crew? 🌴⏎Where are we thinking of going?"
- Priya: "goa for diwali?? 🌴"
- Nudge: "Go suggests places from the chat"

### Icons & images
- Nudge chevron: SVG 14px, stroke 2.6, `M9 6l6 6-6 6`.
- Images: trip avatar; avatars `c58d…`, `cb0a…`, `234f…` at 18px; Priya 30px; Go 20px, 30px and 30px (in the nudge).

---

## P-Chat-FromSheet.dc.html — C4 From sheet: cities in one line + Other city
`<title>Go — Travelling from sheet</title>`

### Purpose (1 line)
The "From?" header chip opens the Travelling from sheet: a single-line city chip strip, an "Other city" search, a privacy note and Save.

### What differs from the shell / sibling screens
- Header H1. Subtitle "Rahul and Priya joined" with 3 avatars.
- The **From? chip is in the active state** (2px black ring via `border:1px solid #000000; box-shadow:0 0 0 1px #000000`; weight 600).
- The list shows only the system pill and Go opener. Priya's message from C3 is absent.
- Static sheet: `top:447px; height:465px`. Search mode: `top:96px`.
- Single CTA "Save". No "Not now".
- City key is `c`, and tapping the selected chip does **not** deselect it.

### Layout top→bottom (only screen-specific parts, with exact styles)
1. Header with the active From? chip. List: system pill and Go bubble. Default composer underneath.
2. Scrim `<a href="P-Chat-Dismissed.dc.html" aria-label="Close sheet">`, z 5.
3. `role="dialog" aria-label="Travelling from"`, style `{{cDlg}}`:
   - Grabber (margin-top 8).
   - Body `padding:8px 16px 120px; gap:12px`:
     - Title "Travelling from" plus X → Dismissed. Subtitle "Where will you start your trip?"
     - Column gap 8: eyebrow "YOUR CITY"; city chip strip (`margin:0 -16px; padding:0 16px; gap:6px; overflow-x:auto`); then either the "Other city" dashed chip or the search block (field, results card, "Places from OpenStreetMap").
     - **Privacy note**: `padding:12px 14px; display:flex; align-items:center; gap:10px; border-radius:18px; background:#FFF6F2`.
       - Lock SVG 16px, stroke 2, currentColor (#0B1B3F): `rect x5 y11 w14 h10 rx2` + `M8 11V8a4 4 0 0 1 8 0v3`.
       - Text 14px, lh 1.4.
   - Footer (gradient, `padding:40px 16px 24px`): **Save** (black 56px pill) → `P-Chat-Dismissed.dc.html`.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- **Travelling from sheet**: open on load.
  - Size: 420×465 at top 447. In search mode it is 816 tall at top 96. The sheet covers the header from y=96 down, leaving only the status-bar zone and the top ~40px of the header row.
  - X, scrim and Save all navigate to Dismissed.
- **Share sheet**: present in code but under the scrim.

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- PBase state: `{c:'blr'}`. PBase also builds `cities` from a 7-city list (no Ahmedabad). It is **unused** by the template, which is a leftover.
- Component state: `{pT:null, pShare:false, pSent:[]}`.
- `cKey='c'`:
  - `cCities` uses the 8-city `CIT` (same list as C1).
  - pick → `setState({c: on && cKey==='from' ? null : id})`. Because `cKey !== 'from'`, the selected chip stays selected (re-select only).
- Search (`cOpen`, `cOnQ`, `cClear`), `MORE` filter (max 6), result pick `{cPicked:n, c:n.toLowerCase(), cSearch:false, cQ:''}`, and `cDlg` all work exactly as in C1. Only the collapsed geometry differs (447/465).
- Share handlers: `pa_0` open, `pa_1..4` targets, `pa_5` close, `pa_6` copy.
- The selection is not persisted. Save is a plain link.

### Navigation table: element → target file
| Element | Target |
|---|---|
| Scrim, sheet X, "Save" | P-Chat-Dismissed.dc.html |
| Back, title | P-TripHome-Zero.dc.html (under scrim) |
| Board icon / chips | P-Board-Zero / DestSuggest / DatesPoll / StaySuggest / BudgetSheet-Slider / FromSheet (self) (under scrim) |
| Share group row / WhatsApp | P-WA-Compose / P-WA-Pick |

### Data shown (seed values)
- "Goa crew" / "Rahul and Priya joined".
- System pill "Trip created · Rahul joined". Go opener (same copy as before).
- Sheet: "Travelling from" / "Where will you start your trip?" / "YOUR CITY".
- Chips: "📍 Bengaluru" (selected), Mumbai, Delhi, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad. Then "Other city".
- Privacy: "Only you and Go see this. Go uses it for your flights, trains and buses."
- CTA: "Save".
- Search data: the same `MORE` list as C1.

### Icons & images
- Search 16px and 18px; X 18px and 14px; lock 16px. Emoji 📍 (selected-chip prefix and result rows), 🛫 (From chip).
- Images: trip avatar; 3 member avatars (18px); Go 20px and 30px.

---

## P-Chat-CitySearch.dc.html — C5 From sheet: Other city expanded with search
`<title>Go — Travelling from sheet</title>` (the same title as C4)

### Purpose (1 line)
The same Travelling from sheet as C4, captured with "Other city" expanded, the query "Ind" typed and results showing.

### What differs from the shell / sibling screens
- **Byte-identical to P-Chat-FromSheet.dc.html except one line.** The Component constructor's initial state adds `cSearch: true, cQ: 'Ind'`.
- Consequences:
  - `cDlg` is the expanded style (`top:96px`, full height).
  - The dashed "Other city" chip is hidden.
  - The search field is shown with "Ind".
  - The results card lists 6 rows.

### Layout top→bottom (only screen-specific parts, with exact styles)
Sheet from y=96 to 912. Contents in order:
1. Grabber.
2. Title "Travelling from" plus X; subtitle.
3. "YOUR CITY" strip, Bengaluru selected.
4. Search block (`.enter`, column gap 10):
   - Field: 52px, radius 16, `border:1.5px solid #0B1B3F`, value "Ind", clear button.
   - Results card: white, radius 18, border #ECEFF3, 6 rows separated by #ECEFF3 hairlines.
   - "Places from OpenStreetMap".
5. Privacy note `#FFF6F2`.
6. Body padding-bottom 120px.
7. Footer: Save.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- The expanded sheet, 420×816. Close and Save behave as in C4 (all go to Dismissed).
- Picking a result collapses the sheet to top 447 and adds the chip, as in C4.
- The clear (X) inside the field empties the query. With an empty query the list shows the first 6 of `MORE`, which happen to be the same 6 rows.

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- Initial state: `{c:'blr', pT:null, pShare:false, pSent:[], cSearch:true, cQ:'Ind'}`.
- Filter for "ind": a name prefix match **or** a region substring match. Every region containing "India" matches, so Imphal, Kochi and Kozhikode appear even though their names don't start with "Ind". Results are sliced to 6.
- Every other handler is identical to C4.

### Navigation table: element → target file
Same as C4. Scrim, X and Save go to P-Chat-Dismissed. Share targets go to P-WA-Compose / P-WA-Pick.

### Data shown (seed values)
- Query: "Ind".
- Results (name / region):
  1. Indore / Madhya Pradesh, India
  2. Indapur / Maharashtra, India
  3. Indi / Karnataka, India
  4. Imphal / Manipur, India
  5. Kochi / Kerala, India
  6. Kozhikode / Kerala, India
- No row is selected (`#F0FAF3` appears only when `cPicked` equals the row).
- All other copy is the same as C4.

### Icons & images
Same as C4. Each result row has a 📍 inside a 34px #F4F5F7 circle.

---

## P-Chat-LongPress.dc.html — D1 Long-press: reactions and copy
`<title>Go — Long-press on a message</title>`

### Purpose (1 line)
Long-pressing a member's message (Arjun's) shows a blurred overlay with an emoji reaction bar, the lifted message and a Reply / Ask Go / Copy menu.

### What differs from the shell / sibling screens
- Later trip state:
  - Header H1, subtitle "Goa · picking dates", **4** avatars (me `c58d…`, Rahul `cb0a…`, Priya `234f…`, Arjun `8c7b…`).
  - Header chips: "📍 Goa ✓" (set, links to Board) and "🛫 Bengaluru ✓" (set). When?, Stay? and Budget? are still unset.
- The list holds 3 white member bubbles (Priya, Kabir, Arjun). There is no system pill and no Go bubble.
- An overlay is open on load (`lpOpen:true`).

### Layout top→bottom (only screen-specific parts, with exact styles)
1. Header (170px) with chip row: [📍 Goa ✓] [📅 When?] [🏡 Stay?] [💰 Budget?] [🛫 Bengaluru ✓].
2. List (padding-bottom 96):
   - Priya (wrapper form): "diwali weekend? 🪔".
   - Kabir (wrapper form, avatar `69bfc542…`): "christmas i’m at home in kochi".
   - Arjun (direct form, avatar `8c7b…`): "in, but only after 6pm fri 😭", followed by the optional reaction pill `{{lpReact}} 1`.
   - `pSent`, then `[data-p-end]`.
3. Default composer.
4. `<sc-if lpOpen>`:
   - **Backdrop** `<button aria-label="Close">`: inset 0, z 5, `background:rgba(11,27,63,0.42); backdrop-filter:blur(6px)` (plus the `-webkit-` prefix).
   - **Overlay column**: `position:absolute; left:16px; right:16px; top:300px; z-index:6; display:flex; flex-direction:column; gap:10px`.
     - **Reaction bar**: `align-self:flex-start; margin-left:30px; padding:4px 6px; display:flex; gap:2px; border-radius:999px; background:#FFFFFF; box-shadow:0 10px 30px rgba(11,27,63,0.25)`.
       - 6 emoji buttons, each 42×42, radius 999, transparent, font-size 24px, `aria-label="React <emoji>"`.
       - Then "More reactions": 42×42, bg #F4F5F7, color #4A5878, plus SVG 18px.
     - **Lifted message**: a duplicate of Arjun's row with `transform:scale(1.03); transform-origin:left center`. Avatar 30px plus the white bubble (max-width 72%).
     - **Action menu**: `margin-left:38px; width:230px; border-radius:18px; background:#FFFFFF; overflow:hidden; box-shadow:0 10px 30px rgba(11,27,63,0.25)`.
       - Each row: `height:52px; padding:0 16px; display:flex; justify-content:space-between; 16px/500 #0B1B3F`. Rows 2–3 have `border-top:1px solid #ECEFF3`. Trailing icon in #4A5878.
       - **Reply** → reply-arrow SVG 18px: `M9 14L4 9l5-5` + `M4 9h10a6 6 0 0 1 6 6v4`.
       - **Ask Go** → Go avatar img 22px (#DCEBFF).
       - **Copy** → copy SVG 18px: `rect x9 y9 w12 h12 rx2` + `M5 15V5a2 2 0 0 1 2-2h10`.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- **Long-press overlay**:
  - Shown on load. It is not animated (no `.enter`).
  - Positioned at a fixed top of 300px, not anchored to the real bubble.
  - Closed by tapping the backdrop, picking a reaction, or Copy. Reply and Ask Go navigate away.
- **Share sheet**: header share (`pa_8`). The header is under the backdrop while the overlay is open; the share sheet is reachable after dismissing it.
- Attach popover and recording pill as in the shell (reachable after dismissing).

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- State: `{pT:null, pShare:false, pSent:[], lpOpen:true}`. Implicit `lpReact`.
- Derived: `lpOpen = s.lpOpen !== false`; `lpHas = !!lpReact`; `lpReact = s.lpReact || ''`.
- Handlers:
  - `pa_0` → `lpOpen:false` (backdrop).
  - `pa_1`…`pa_6` → `{lpOpen:false, lpReact:<emoji>}` plus a toast:
    - "You reacted ❤️ to Arjun"
    - "You reacted 😂 to Arjun"
    - "You reacted 🔥 to Arjun"
    - "You reacted 👍 to Arjun"
    - "You reacted 😮 to Arjun"
    - "You reacted 🙏 to Arjun"
  - `pa_7` (Copy) → `lpOpen:false` plus toast "Message copied".
  - `pa_8` → open share.
  - `pa_9` (More reactions) → toast "Your full emoji keyboard opens here". The overlay stays open.
  - `pa_10` → "Opens Messages with the link filled in", then close share.
  - `pa_11` → "Opens Gmail with the link filled in", then close share.
  - `pa_12` → "Invite link copied", then close share.
  - `pa_13` → "Opens your phone’s share menu", then close share.
  - `pa_14` → close share.
  - `pa_15` → "Invite link copied".
- After reacting, the pill "<emoji> 1" appears with `.enter` beside Arjun's bubble. Reacting again replaces the emoji; the count is always 1.
- There is no long-press gesture handler. The overlay is just the initial state, and it cannot be reopened once dismissed.

### Navigation table: element → target file
| Element | Target |
|---|---|
| Back, title | P-TripHome-Zero.dc.html |
| Board icon; chip "📍 Goa ✓" | P-Board-Zero.dc.html |
| When? / Stay? / Budget? | P-Chat-DatesPoll / P-Chat-StaySuggest / P-Chat-BudgetSheet-Slider |
| "🛫 Bengaluru ✓" | P-Chat-FromSheet.dc.html |
| Menu "Reply" | P-Chat-Reply.dc.html |
| Menu "Ask Go" | P-Chat-AskGo.dc.html |
| Share group row / WhatsApp | P-WA-Compose / P-WA-Pick |

### Data shown (seed values)
- "Goa crew" / "Goa · picking dates".
- Chips: "Goa" (✓), "When?", "Stay?", "Budget?", "Bengaluru" (✓).
- Messages:
  - Priya: "diwali weekend? 🪔"
  - Kabir: "christmas i’m at home in kochi"
  - Arjun: "in, but only after 6pm fri 😭"
- Reactions: ❤️ 😂 🔥 👍 😮 🙏 (+ more).
- Menu: "Reply", "Ask Go", "Copy".
- Toasts as listed above.

### Icons & images
- Check badge SVG 9px, stroke 4, white on #16A34A. Plus 18px (more reactions). Reply-arrow 18px. Copy 18px.
- Emoji: 🪔 😭 ❤️ 😂 🔥 👍 😮 🙏 📍 📅 🏡 💰 🛫.
- Images:
  - Avatars 30px: Priya `234f…`, Kabir `69bfc54292a613a03a29fc39e4720fed`, Arjun `8c7b…` (twice: list and lifted copy).
  - Go `5bda…` at 22px in the menu and 30px for dynamic Go replies.
  - Header stack at 18px: `c58d`, `cb0a`, `234f`, `8c7b`. Kabir is not in the header stack.
  - Trip avatar.

---

## P-Chat-Reply.dc.html — D2 Replying: send posts the reply
`<title>Go — Replying to a message</title>`

### Purpose (1 line)
Reply mode targeting Arjun's message: a white composer tray with a "Replying to Arjun" banner and a prefilled draft. Send posts a black bubble with a quote block, followed by the Go ack.

### What differs from the shell / sibling screens
- Header, chips and the 3 member messages are the same as D1, with no reaction pill and no overlay.
- List padding-bottom is **150px**.
- The default composer is replaced by the **tray composer** (Reply variant, accent #A44F3A). The tray has no attach and no mic.

### Layout top→bottom (only screen-specific parts, with exact styles)
1. Header and list as in D1. `pSent` loop and `[data-p-end]` are present.
2. Tray, bottom: `padding:10px 16px 24px; gap:8px; bg #FFFFFF; radius 22px 22px 0 0`, shadow `0 -1px 0 rgba(11,27,63,0.06), 0 -8px 24px rgba(11,27,63,0.08)`.
   - `<sc-if rpOpen>` banner: bg #F4F5F7, radius 14, `border-left:3px solid #A44F3A`.
     - Title "Replying to Arjun" (13px/700 #A44F3A).
     - Snippet "in, but only after 6pm fri 😭" (14px #4A5878, ellipsis).
     - Cancel X 32px → P-Chat-LongPress.
   - Input row:
     - Pill 48px #F4F5F7. `<input id="msg">` value `{{text}}`, placeholder "Reply to Arjun".
     - Send `<button aria-label="Send">`, 48px black, arrow icon.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- Share sheet only (header share, `pa_1`; close `pa_6`; copy `pa_7`).
- There is no attach popover or recording pill in this variant.

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- PBase state: `{text:'works if we leave fri night'}`. PBase `renderVals` exposes `text` and `onText` (sets `text`).
- Component adds `{pT:null, pShare:false, pSent:[]}`. Implicit `rpDone`.
- Derived: `rpOpen = !rpDone`.
- `pa_0` (Send):
  - `t = text.trim()`.
  - If `t` is non-empty → `_send(t, 'Arjun · in, but only after 6pm fri 😭')`, then `{text:'', rpDone:true}`.
  - The banner hides. A black "mine" bubble appears (`.enter`) with the quote block "Arjun · in, but only after 6pm fri 😭" (rgba white 14%, left rule #F0C9BC) above "works if we leave fri night".
  - After 1200ms the Go ack "Got it 👍 I’ll factor that into the plan." appears. Both events smooth-scroll to `[data-p-end]`.
  - Sending an empty draft does nothing.
- After sending, the tray stays in reply styling without the banner. The placeholder still reads "Reply to Arjun". Any later send also quotes Arjun, because the quote is hard-coded in `pa_0`.
- Share handlers:
  - `pa_1` → open.
  - `pa_2` → Messages toast.
  - `pa_3` → Gmail toast.
  - `pa_4` → "Invite link copied".
  - `pa_5` → share-menu toast.
  - `pa_6` → close.
  - `pa_7` → copy.

### Navigation table: element → target file
| Element | Target |
|---|---|
| Banner cancel X | P-Chat-LongPress.dc.html |
| Back, title | P-TripHome-Zero.dc.html |
| Board icon, "📍 Goa ✓" | P-Board-Zero.dc.html |
| When? / Stay? / Budget? / "🛫 Bengaluru ✓" | DatesPoll / StaySuggest / BudgetSheet-Slider / FromSheet |
| Share group row / WhatsApp | P-WA-Compose / P-WA-Pick |

### Data shown (seed values)
- Header and messages as in D1.
- Banner: "Replying to Arjun" / "in, but only after 6pm fri 😭".
- Draft: "works if we leave fri night". Placeholder: "Reply to Arjun".
- Posted quote string: "Arjun · in, but only after 6pm fri 😭".
- Go ack: "Got it 👍 I’ll factor that into the plan."

### Icons & images
- X 14px (cancel). Send arrow 20px. Header icons as in D1.
- Images: avatars as in D1, minus the lifted copy and the menu Go icon. Go 30px for the ack.

---

## P-Chat-AskGo.dc.html — D3 Ask Go: suggestions fill the box
`<title>Go — Ask Go about a message</title>`

### Purpose (1 line)
Ask-Go mode about Arjun's message: the tray shows an "Ask Go about Arjun’s message" banner and 3 suggested questions that fill the input. Send jumps to the dates poll.

### What differs from the shell / sibling screens
- Same header, chips and 3 member messages as D1/D2.
- **No `pSent` loop and no `[data-p-end]`**; messages never append.
- List padding-bottom is **190px**.
- Tray composer, Ask Go variant (accent #0B1B3F), with a suggestion chip row.
- The Send control is an `<a>` link, not a button.

### Layout top→bottom (only screen-specific parts, with exact styles)
1. Header and list as in D1 (static only).
2. Tray (same chrome as D2):
   - Banner: `border-left:3px solid #0B1B3F`, bg #F4F5F7, radius 14.
     - Title line (13px/700 #0B1B3F): inline-flex gap 6 with Go avatar img 18×18 #DCEBFF, then "Ask Go about Arjun’s message".
     - Snippet "in, but only after 6pm fri 😭".
     - Cancel X 32px → P-Chat-LongPress.
   - Suggestion row: `display:flex; gap:6px; overflow-x:auto; scrollbar-width:none`. 3 chips, 36px tall, padding 0 12, white, border #DDE1E6, 13px/600, nowrap, `role=button`.
   - Input row:
     - Pill 48px #F4F5F7. Input value `{{pDraft}}`, placeholder "Ask Go anything about this".
     - Send `<a href="P-Chat-DatesPoll.dc.html" aria-label="Send">`, 48px black, arrow.

### Sheets / overlays (trigger, dimensions, backdrop, contents, buttons, close behaviour)
- Share sheet only (header share `pa_3`; close `pa_8`; copy `pa_9`).

### State & interactions (from the DCLogic script: state vars + initial values, every handler, toast texts, timers, derived values)
- State: `{pT:null, pShare:false, pSent:[]}`. Implicit `pDraft` starts as `''`.
- Handlers:
  - `pa_0` → `pDraft:"Flights after 6 pm Fri?"`.
  - `pa_1` → `pDraft:"Can we leave Sat morning?"`.
  - `pa_2` → `pDraft:"Sum up everyone’s dates"`.
  - These replace the input value and do not send.
  - `pOnDraft` → typing.
  - `pa_3` → open share.
  - `pa_4` → Messages toast.
  - `pa_5` → Gmail toast.
  - `pa_6` → "Invite link copied", then close.
  - `pa_7` → share-menu toast.
  - `pa_8` → close share.
  - `pa_9` → copy toast.
- Send always navigates to P-Chat-DatesPoll, whatever the draft (even empty). `_send` is defined but never called, so there is no Go ack or scroll.
- Suggestion chips have no selected state.

### Navigation table: element → target file
| Element | Target |
|---|---|
| Send | P-Chat-DatesPoll.dc.html |
| Banner cancel X | P-Chat-LongPress.dc.html |
| Back, title | P-TripHome-Zero.dc.html |
| Board icon, "📍 Goa ✓" | P-Board-Zero.dc.html |
| When? / Stay? / Budget? / "🛫 Bengaluru ✓" | DatesPoll / StaySuggest / BudgetSheet-Slider / FromSheet |
| Share group row / WhatsApp | P-WA-Compose / P-WA-Pick |

### Data shown (seed values)
- Header and messages as in D1.
- Banner: "Ask Go about Arjun’s message" / "in, but only after 6pm fri 😭".
- Suggestions: "Flights after 6 pm Fri?", "Can we leave Sat morning?", "Sum up everyone’s dates".
- Placeholder: "Ask Go anything about this".

### Icons & images
- Go avatar 18px in the banner. X 14px. Send arrow 20px. Header icons and avatars as in D1. No Go bubbles.

---

## Group notes

### Shared element names (proposed component vocabulary)
- **ChatFrame**: 420×912, bg #F6F7F9, flex column, overflow hidden.
- **ChatHeader** [PLAN: `ChatHeader`]: white, padding 56/0/12, two-layer shadow. Two variants: H1 (170px) and H2 (178px, GoA only).
  - **IconButton44** [PLAN: `Button variant=ghost size=icon`]: 44px round, #000, 20–22px stroke-2 icons.
  - **TripAvatar44** [PLAN: `Avatar kind=trip size=44`]: #FFF1DC circle with a 40px image.
  - **AvatarStack18** [PLAN: `AvatarStack size=18 overlap=-5 ring=white-thin`]: 18px, 1.5px white ring, −5px overlap.
- **FactChip** [PLAN: `FactChip` / `Chip size=md`] (header chip): 36px pill, white, 1px #DDE1E6, 14px/500, 16px emoji slot. States: unset ("X?"), set (value + **CheckBadge16** [PLAN: `CheckBadge size=16`] #16A34A), active (2px black ring, 600).
- **SystemPill** [PLAN: `SystemPill`]: white pill, 13px #4A5878, 20px Go avatar, bubble shadow.
- **Avatar30** [PLAN: `Avatar size=30`]: message avatar; Go version has bg #DCEBFF.
- **Bubble** [PLAN: `Bubble`]: radius 20 with one 0 corner (tail).
  - `BubbleGo` [PLAN: `Bubble author=go` / `GoBubble`]: #F6EAE6, label "Go" #A44F3A 13px/600.
  - `BubbleMember` [PLAN: `Bubble author=member`]: #FFFFFF, grey name 13px/600 #4A5878.
  - `BubbleMine` [PLAN: `Bubble author=me`]: #000000, white text, `20 20 0 20`.
  - Static seed bubbles have padding 8/14/10, gap 2 and a shadow. Dynamic bubbles have padding 10/14, gap 4, no shadow, max-width 78%.
  - **QuoteBlock** [PLAN: `QuoteBlock`]: rgba(255,255,255,.14), 3px #F0C9BC rule, radius 10, 13px.
  - **ReactionPill** [PLAN: `ReactionChip`]: white, border #ECEFF3, 13px/600, "emoji 1".
- **QuickReplyBlock** [PLAN: `QuickReplyBlock`]: 38px left inset, "TAP TO REPLY" eyebrow, **ReplyChip40** [PLAN: `Chip size=lg`] (40px, white, #DDE1E6, 14px/600).
- **GoNudgePill** [PLAN: `GoNudgePill` / `NextStepPill`]: 42px navy pill, 30px Go avatar, chevron.
- **Composer (default)** [PLAN: `Composer`]: gradient bar, padding 24/16/24, **AddButton48** [PLAN: `Button variant=white size=icon-lg`] (white + shadow), **InputPill48** [PLAN: `Input shape=pill`] (white), **MicSendButton48** [PLAN: `MicSendButton`] (black, red #B42318 while recording), **AttachMenu220** [PLAN: `AttachMenu`], **RecordingPill40** [PLAN: `RecordingPill`].
- **ComposerTray** [PLAN: `ComposerTray`] (reply / ask-go): white, radius 22 top, upward shadow.
  - **ContextBanner**: #F4F5F7, radius 14, 3px left accent (#A44F3A reply, #0B1B3F Go), 32px cancel.
  - **InputPill48** [PLAN: `Input shape=pill-grey`] grey (#F4F5F7).
  - **SendButton48** [PLAN: `Button variant=primary size=icon-lg`] black.
  - **SuggestionChip36** [PLAN: `Chip size=xs`] (13px/600).
- **BottomSheet** [PLAN: `BottomSheet`]: scrim navy 38%, radius 28/28/0/0, #F6F7F9, shadow `0 -8px 30px`, **Grabber 40×5 #DDE1E6**, **SheetTitle 22px/600**, **SheetClose40** [PLAN: `Button variant=white size=icon-sm`] (white, shadow), **Eyebrow 11px/700 0.08em** [PLAN: `Eyebrow`], **SheetFooter** [PLAN: `SheetFooter`] (gradient, padding 40/16/24), **PrimaryCTA56** [PLAN: `Button variant=primary size=xl`] (black, 18px/500), **TextButton44** [PLAN: `Button variant=link size=base`] (#A44F3A 16px/600).
- **ChoiceChip40** [PLAN: `Chip size=lg pressed` (in `ChoiceChipGroup`)]: off is white with a #DDE1E6 border; on is black/white.
- **DashedChip40** [PLAN: `OtherCityChip` / `Chip size=lg variant=dashed`] ("Other city", 1px dashed #A5ACB8).
- **SearchField52** [PLAN: `SearchField`]: radius 16, 1.5px #0B1B3F, 36px clear.
- **ResultList** [PLAN: `ResultList`]: white card radius 18; rows padding 10/4, 34px pin, selected #F0FAF3.
- **PrivacyNote** [PLAN: `InfoNote`]: #FFF6F2, radius 18, lock icon.
- **ShareInviteSheet** [PLAN: `ShareInviteSheet`]: invite card + Copy, recent WhatsApp group row, 5 target tiles 56px radius 18.
- **Toast** [PLAN: `Sonner` toast via `toastGo`]: navy, radius 16, bottom 108, 2200ms.
- **LongPressOverlay** [PLAN: `LongPressOverlay`]: scrim 42% + blur 6; **ReactionBar** (42px emoji buttons + more); lifted bubble scale 1.03; **ContextMenu230** (52px rows, #ECEFF3 dividers).

### Sibling-state collapses
- **C4 FromSheet ≡ C5 CitySearch**: the same file except initial state `cSearch:true, cQ:'Ind'`. In a real build this is one sheet with a `searchOpen` + `query` state.
- **C1 QuickStart vs C4 FromSheet**: the same sheet scaffold and the same city-picker sub-component (CIT/MORE/filter/pick/expand-to-top-96). They differ in:
  - title/subtitle copy;
  - C1 having the vibe and spend groups plus a footnote, while C4 has the privacy note;
  - collapsed geometry (C1 top 384 / h 528; C4 top 447 / h 465);
  - CTAs (C1 Done → GoA + Not now → Dismissed; C4 Save → Dismissed);
  - deselect semantics (C1 `from` can be cleared; C4 `c` cannot);
  - the active From? chip (C4 only).
- **C1, C2 and C3 are one chat at different moments**, before and after Quick start:
  - C1 is the chat plus the QuickStart sheet overlay.
  - C2 is the post-Done chat with tap-to-reply chips. It is also the only H2 header.
  - C3 is post-dismiss, after Priya has joined and posted, with the Go nudge.
  - The underlying chat for C1/C4/C5 (system pill + Go opener) equals C2 without the tap-to-reply chips.
- **D1, D2 and D3 are one conversation state** (header "Goa · picking dates", the same chips, Priya/Kabir/Arjun messages). Only the overlay/composer mode toggles:
  - D1: `lpOpen` overlay over the default composer.
  - D2: composer mode `reply(target=Arjun)` with draft "works if we leave fri night".
  - D3: composer mode `askGo(target=Arjun)` with suggestion chips and an empty draft.
  - D2 and D3 cancel back to D1, which reopens the long-press overlay rather than returning to a plain chat. There is no "plain chat" artboard for this state in the group.

### Navigation graph (in-group edges)
- C1 → C2 (Done), C1 → C3 (Not now / X / scrim).
- C4/C5 → C3 (Save / X / scrim).
- Every chat's From? chip → C4.
- D1 → D2 (Reply), D1 → D3 (Ask Go).
- D2 → D1 (cancel), D3 → D1 (cancel).
- D3 → P-Chat-DatesPoll (Send).

Out-of-group targets:
- P-TripHome-Zero (back, title)
- P-Board-Zero (board icon; set Goa chip)
- P-Chat-DestSuggest (Where?, reply chips, Go nudge)
- P-Chat-DatesPoll (When?, Ask Go send)
- P-Chat-StaySuggest
- P-Chat-BudgetSheet-Slider
- P-WA-Compose
- P-WA-Pick

### Surprises / ambiguities
1. **Bubble colour vs brief.** The brief says "theirs: #F6EAE6". In these files **#F6EAE6 is Go's bubble only**. Other human members use **#FFFFFF** with a shadow and a grey (#4A5878) name. The mock's dynamic renderer treats every non-me message as Go (`go: !m.me`).
2. **Inconsistent bubble metrics.** Static Go bubbles are max-width 76%, padding 8/14/10, gap 2, with shadow. Member bubbles are 72%. Dynamic bubbles are 78%, padding 10/14, gap 4, with **no shadow**. Member name markup has two slightly different typographic forms.
3. **The quote block is styled for black bubbles only** (white 14% wash). It would be near-invisible on #F6EAE6 or #FFFFFF.
4. **No timestamps, date separators, read receipts, typing indicator or rich Go cards** (actions, "Just for you" footer) in this group. Those must come from other artboards.
5. **The header has 2 variants** (H1 gap 4 / title 52px; H2 gap 8 / title 60px, GoA only). This is likely drift; recommend standardising on H1.
6. **Stale or inconsistent seed copy.**
   - The system pill says "Trip created · Rahul joined" even when the header says "Rahul and Priya joined".
   - C4/C5 omit Priya's message although their header says she joined.
   - Kabir posts in D1–D3 but is not in the 4-avatar header stack.
   - "⛰️ Hills" (C1) vs "⛰️ Mountains" (C2).
7. **The CitySearch filter matches the region substring.** "Ind" matches every "…, India" region, so Imphal, Kochi and Kozhikode appear. An empty query also returns the same first 6. The behaviour is probably unintended; real search should prefix-match the name and/or use OSM ranking.
8. **There is no way to exit search mode** in C1/C4/C5 without picking a result. Clear only empties the query.
9. **Selections are not persisted.** Done and Save are plain links. Sheet close always goes to **Dismissed (C3)** even when the From sheet is opened from the D-state chat, where the "Bengaluru ✓" chip links to it. Return should go to the originating chat.
10. **AskGo Send ignores the draft** and navigates to DatesPoll. There is no `pSent` loop and no `[data-p-end]`. Reply's quote is hard-coded, so all later sends quote Arjun.
11. **The long-press overlay is not anchored.** It sits at a fixed top of 300px with a duplicated bubble at scale 1.03. There is no actual long-press gesture, and it can't be reopened after dismissal. The reaction pill renders **beside** the bubble (flex sibling with −6px top margin), not overlapping its bottom edge.
12. **The `.live` pulse is green** (rgba(22,163,74,.12)) on the red recording pill.
13. **Static sheets have no `.enter` animation.** Only the share sheet, toasts, popovers and new messages animate.
14. **Dead code.** `froms` (C1 PBase) and `cities` (C4/C5 PBase) are computed but unused. In sheet states, the header and composer handlers exist but sit under the z-5 scrim.
15. **Duplicate `<title>`.** C4 and C5 share "Go — Travelling from sheet".
16. **The font stack lists Satoshi first** but only Figtree is loaded.
17. **Expanded sheet top 96px** covers almost all of the header (header is 170px). With `top:96`, the sheet top edge cuts through the header row zone. This is intentional "near-full-screen" behaviour.
