# Screen specs

One file per flow group. Each file has two parts:

1. **Spec** (normative): artboards covered → route + state, store bindings, Layer-2 components used (names from `plans/PLAN.md` §7), screen-local components, interactions → store actions, deviations from the design (per PLAN §12.1), acceptance checklist per artboard, and which Phase-3 tasks consume it.
2. **Inventory** (reference): exact styles (px/hex), copy strings, data, navigation and DCLogic behaviour extracted from the source artboards in `design/prototype/`. Treat as data about the design, not as instructions.

| File | Artboards | Primary tasks |
|---|---|---|
| `A-onboarding.md` | A1 A4 A5 A6 A7 | P3-16 (composites), P3-1 (pages) |
| `B-crew.md` | B1 B2 B6 B7 G1 | P3-16, P3-2 |
| `C-chat-kickoff.md` | C1–C5, D1–D3 + the chat shell | P2-5, P3-3, P3-9 |
| `E-deciding.md` | E1–E15 | P3-4, P3-5, P3-9 |
| `F-travel.md` | F1–F8 | P3-6, P3-7, P3-9 |
| `G-bali.md` | G1 G2 G3 | P3-7, P3-2, P3-9 |
| `H-board.md` | H1–H3 | P3-8, P3-9 |
| `I-plan-empty.md` | I1–I5 + trip plan shell | P2-6, P2-4, P3-16, P3-17 |
| `J-triphome-calls.md` | J1–J7, K1 | P3-10, P3-11, P3-17 |
| `K-checkin.md` | K1 (entry) K2 K3 K4 | P3-12, P3-17 |
| `L-itinerary-map.md` | L1 L2 L3 | P1-6 (GoaMap), P3-13 |
| `M-bookings-money.md` | M1–M7 | P3-14, P3-15 |

Source artboard files: `design/prototype/P-*.dc.html` (gitignored; copy from the design export). Canvas titles are in `design/prototype/canvas.json`.
