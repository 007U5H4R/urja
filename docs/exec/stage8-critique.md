# Stage 8 design critique (TSK-15.1): DES triage

**Run:** 2026-10-05 on the preview `urja-git-build-stage7-tushar-49a6.vercel.app`, build/stage7 at 68aced0 (Vercel status success).
**Method (EXE29):** three fresh critic subagents compared the preview with Design.md and `.design/exploration/final/`:
- **A:** Today and Trip;
- **B:** the phone screens, Ask and states;
- **C:** Why Urja, OG, and the §17 Stage 8 accessibility items.

Their 40 raw findings (A1–A14, B1–B13, C1–C13) merge into DES-2…DES-39 below. DES-1 was fixed in f634a0e.
**Freeze:** no finding needs a Design Freeze change. Every fix restores the frozen spec or is a pixel, accessibility, browser or copy fix.
**Fix units:** S1 (global CSS, shell, Today, Trip), S2 (phone, states, scene, Why, fonts), S3 (Ask server and copy, maps). Each has one implementer with TDD, a spec review and a quality review, at most 2 fix rounds, and one commit.

| DES | Sev | Raw | Finding | Action | Unit |
|---|---|---|---|---|---|
| DES-2 | major | A1 | `.glass` loses `backdrop-filter` in the built CSS: the minifier keeps only `-webkit-`, which Chromium and Firefox ignore | fix | S1 |
| DES-3 | major | A2, C2 | 24-truck table clipped with no way to scroll at 320 px, 761–860 px and 200% text | fix | S1 |
| DES-4 | major | A3, B6, C3, C8 | Touch targets: `.eye .open` 19.5 px (axe `target-size`, serious); trip actions 40 px and icon buttons 38 px on coarse pointers; segment 30 px; Ask close and Try again and state CTAs 38–40 px; TC-031 axe lacks `wcag22aa` | fix | S1 (global), S2 (ask/states CSS) |
| DES-5 | major | C1 | Focus hidden under the sticky top bar and the brief dock (WCAG 2.4.11) | fix | S1 |
| DES-6 | major | C4 | At 320 px the Ask composer pushes "Ask" off-screen (`min-width: 0`) | fix | S1 |
| DES-7 | major | C5 | At ≤ 1020 px the Today tab order runs hero before eyes, against the visual order (2.4.3) | fix | S1 |
| DES-8 | major | C6 | Map view: Tab reaches off-map flag markers, so focus is invisible (2.4.7) | fix | S3 |
| DES-9 | major | B1 | A model answer about Check flags has no caveat; the fallback has one | fix | S3 |
| DES-10 | minor | A4 | Rail knob caption collides with the rail-box header near either end | fix | S1 |
| DES-11 | minor | A5 | R3 chart: dashed normal line strikes through the red note | fix | S3 |
| DES-12 | minor | A6 | Hero map labels overlap: "Behror" on "Delhi", "Kishangarh pump" on "Jaipur" | fix | S3 |
| DES-13 | minor | A7 | Fitted camera puts the end-city label under the rail box | fix | S3 |
| DES-14 | minor | A8 | "→" missing from the self-hosted Inter subsets, so it falls back and the glass-card route wraps | fix | S2 |
| DES-15 | minor | A9 | KPI footer wraps on one card, so its rule sits out of line | fix | S1 |
| DES-16 | minor | A13 | R5 toll table sits under the fuel heading, stretched full width | fix | S1 |
| DES-17 | minor | B2 | Ask cited-trip rows identical (plate · route); the mockup shows date and litres | fix | S3 |
| DES-18 | minor | B3 | Ask 429 state blames the AI, shows two retry times, and leaves Try again enabled | fix | S3 |
| DES-19 | minor | B4 | `/brief?state=clean` headline dimmed by the brief's `.m .clean` rule | fix | S2 |
| DES-20 | minor | B5 | `/message` header subtitle wraps to 2–3 lines at 320–390 px | fixed in part: Hindi is one line from 360 px; English wraps to 2 lines below 414 px rather than cutting off the firm name (orchestrator's choice; 44 px toggle kept) | S2 |
| DES-21 | minor | B7 | The English phone menu's "Morning brief" opens the Hindi brief | fix | S2 |
| DES-22 | minor | B8 | Hindi status "पक्का किया" collides with the High word "पक्का"; fallback Hindi missing from hindi-review.md | fix | S3 |
| DES-23 | minor | B9 | `/message` preview trace: 59 hairline bars hide the fuel drop | fix | S2 |
| DES-24 | minor | B10 | Trip error state draws a focus ring on the heading at first paint | fix | S2 |
| DES-25 | minor | B11 | axe: `region` on the /brief dock, `heading-order` on /message, `aria-allowed-role` on the drawer | fix | S3 (dock, drawer), S2 (message heading) |
| DES-26 | minor | C7 | Map attribution under the glass rail box, so its links can't be clicked | fix | S3 |
| DES-27 | minor | C9 | Why ch. 03 hides the "still lacks" column at ≤ 860 px | fix | S2 |
| DES-28 | minor | C10 | Text-only 200% breaks the shell (fixed heights, nowrap tiles) | fix (the scene-tag overlap part parked: hero composition) | S1 |
| DES-29 | minor | C11 | Brief Ask input has no focus ring | fix | S1 |
| DES-30 | nit | A14 | Fallback scene tag runs under the glass card at 1021–1030 px | fix | S2 |
| DES-31 | nit | B12 | `/message` Hindi headline orphans "नहीं" | fix | S2 |
| DES-32 | nit | C12 | No skip link | fix | S1 |
| DES-33 | nit | C13 | 320 px: "−₹" splits at a line break; eyes "who" ellipsised | fix (the map label left as is) | S1 |
| DES-34 | minor | A10 | Clean trip 0927-09 shows "189.89 L" beside "190 L" | **park: user decision** (27 Sep diesel is an anchor; options: show "189.9 L" on both, or drop "× ₹90" on fractional rows) | — |
| DES-35 | minor | A11 | Expanded table repeats 5,924 km for 8 hidden trucks | **park: user decision** (needs a generator change and a regenerated scenario.json; anchors unchanged) | — |
| DES-36 | minor | A12 | R4 trip map doesn't show the 92.5 km deviation | **park** (R4 isn't on the demo path; Stage 9 candidate) | — |
| DES-37 | nit | B13 | `/message` link card shows the per-deploy preview host | **park** (production shows the production host; set `NEXT_PUBLIC_SITE_URL` if the demo runs on a preview) | — |
| DES-38 | nit | A8 (rest) | With the arrow glyph fixed (DES-14), the 1440 glass-card route line "Ramesh Kumar · Jaipur → Delhi (Okhla)" still wraps: it needs 244–267 px in a 242 px box | **park** (a wider `.floatcard` would cover the hero camera's fitted area and touch the hero composition, a freeze item; the copy stays) | — |
| DES-39 | minor | QA (unit F review) | With text-only 200%, /why still scrolls sideways at 421–~470 px (the essay metric `.n.lit`) and at 320 px (`table.cmp`). Page zoom is fine | **park** (WCAG 1.4.4 is met through page zoom; Stage 10/11 polish candidate) | — |

**Still open from the Stage 7 candidates, re-confirmed and parked:**
- balancer-trip outliers in route normals (EXE9);
- "updated just now" on the fleet card;
- OG mini chart with 2 red bars (data-true);
- `poster-img.ts` on a Next internal;
- Wave, Meter and Rail degenerate-input nits.

## §17 Stage 8 verification (before fixes)
- **320 px reflow:**
  - `/` and `/?view=map`: FAIL (DES-3, DES-6);
  - `/trips/0926-04`, `/brief` (hi, en), `/message` and `/why`: PASS.
- **200% text:** page zoom PASS on all 7 routes (closes the §17 item); text-only resizing FAIL (DES-28).
- **Keyboard-only:** all 6 TC-020 steps are operable. It stays open on DES-5, DES-7, DES-8 and DES-29.

The after-fix results are recorded in the gate report (docs/exec/ledger.md).
