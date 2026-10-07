# Test Cases — Urja

**Stage:** 6 · Technical Planning · **Ticket:** TASK-4 · **Status:** planned. Every case stays `Not run` until Stage 7.

**IDs:**
- Each case has a `TC-###` ID, owned by this file and never reused.
- A web-deliverables contract name, where one applies, follows in brackets, e.g. [TC-UI-RESPONSIVE].
- Findings use the `DES-`, `CR-`, `QA-` and `SEC-` prefixes.

**Expected values** come from `HANDOFF.md` and `technical-plan.md` §4.3. They are asserted as fixed values, never recomputed with the same code being tested.

**Scope:** cases are prioritised by real risk, not padded out. Ask Urja's answer quality is measured separately, by the eval in `evals/` (EVAL-001–EVAL-013).

**Legend:**
- **Status:** Not run → Pass / Fail / Blocked (with a reason).
- **Auto:** A = automated, M = manual.

## Index
| ID | Title | Milestone · Ticket · Task | Type | Pri | Auto |
|---|---|---|---|---|---|
| TC-001 | Yesterday's ledger totals | M-001 · TKT-02 · TSK-02.7 | unit (golden) | P0 | A |
| TC-002 | Yesterday's unaccounted breakdown | M-001 · TKT-02 · TSK-02.7 | unit (golden) | P0 | A |
| TC-003 | Trip 0926-04 (R1) evidence, timeline and ledger | M-001/2 · TKT-02, TKT-05 | unit + E2E | P0 | A |
| TC-004 | Trip 0927-02 (R2) | M-001 · TKT-02 | unit (golden) | P0 | A |
| TC-005 | Trip 0926-11 (R3) | M-001 · TKT-02 | unit (golden) | P0 | A |
| TC-006 | September diesel: series, incidents, Behror | M-001/2 · TKT-02, TKT-04 | unit + E2E | P0 | A |
| TC-007 | September flags: counts, flagged, recovered, weeks | M-001/2 · TKT-02, TKT-04 | unit + E2E | P0 | A |
| TC-008 | Trucks table and Anil's September | M-001/2 · TKT-02, TKT-04 | unit + E2E | P0 | A |
| TC-009 | Last 7 days (21–27 Sep) | M-001 · TKT-02 | unit (golden) | P0 | A |
| TC-010 | 14-day profit series and the 24 Sep clean day | M-001/2 · TKT-02, TKT-06, TKT-11 | unit + E2E | P1 | A |
| TC-011 | Rule thresholds and detection completeness | M-001 · TKT-02 · TSK-02.5 | unit + property | P0 | A |
| TC-012 | Determinism | M-001 · TKT-02 · TSK-02.7 | unit | P0 | A |
| TC-013 | Physical plausibility | M-001 · TKT-02 · TSK-02.3–02.4 | unit | P1 | A |
| TC-014 | Wording guard (no accusation words) | M-001 · TKT-02 (+ all UI) | static test | P0 | A |
| TC-015 | Brief template in Hindi and English | M-002 · TKT-06 · TSK-06.1 | unit (snapshot) | P0 | A |
| TC-020 | Five-step demo path | M-002/M-005 · TKT-15, TKT-16 | E2E | P0 | A + M |
| TC-021 | Numbers agree across screens | M-002 · TKT-02..TKT-06 | E2E + static | P0 | A |
| TC-022 | No horizontal scroll at 375 / 768 / 1440 [TC-UI-RESPONSIVE] | every UI ticket | E2E | P0 | A |
| TC-023 | Mobile navigation [TC-UI-MOBILE-NAV] | M-001 · TKT-03 | E2E | P1 | A |
| TC-024 | Screen states [TC-UI-EMPTY, TC-UI-ERROR] | M-002/3 · TKT-05, TKT-11, TKT-12 | E2E | P1 | A |
| TC-025 | List ↔ map linking (D4) | M-002 · TKT-10 | E2E | P1 | A |
| TC-026 | Ask drawer: keyboard and focus | M-003 · TKT-12 | E2E | P0 | A |
| TC-027 | Language toggle | M-002 · TKT-06 | E2E | P0 | A |
| TC-028 | Map unavailable state | M-002 · TKT-10 | E2E | P1 | A |
| TC-029 | 3D fallback on a software GPU | M-004 · TKT-14 | E2E | P1 | A |
| TC-030 | 3D on a real GPU: controls, reduced motion, dispose | M-004 · TKT-14 | manual + E2E | P1 | M + A |
| TC-031 | Accessibility scan (axe) | every UI ticket; TKT-15 | E2E | P1 | A |
| TC-032 | Keyboard-only pass, 320 px reflow, 200% text | M-005 · TKT-15 | manual | P1 | M |
| TC-040 | Ask happy path (mocked model) | M-003 · TKT-07 | integration | P0 | A |
| TC-041 | Ask timeout → fallback | M-003 · TKT-07 | integration | P0 | A |
| TC-042 | Ask upstream errors → fallback | M-003 · TKT-07 | integration | P0 | A |
| TC-043 | Ask rate limit and daily cap | M-003 · TKT-07 | unit | P1 | A |
| TC-044 | Ask citation guard | M-003 · TKT-07 | unit | P0 | A |
| TC-045 | Gemini key hygiene | M-003 · TKT-07 | unit + build check | P0 | A |
| TC-046 | Fallback intents for the 10 prepared questions | M-003 · TKT-07 | unit | P0 | A |
| TC-050 | OG and Twitter metadata and asset [TC-WEB-OG-METADATA, TC-WEB-OG-ASSET] | M-004/5 · TKT-09, TKT-16 | integration | P1 | A |
| TC-051 | Live unfurl [TC-WEB-OG-UNFURL] | M-005 · TKT-16 | manual | P1 | M |
| TC-055 | Performance budget | M-004/5 · TKT-10, TKT-14, TKT-15 | build check + Lighthouse | P1 | A + M |
| TC-060 | `pnpm verify` green in CI | M-001 · TKT-01 (every ticket) | CI | P0 | A |
| TC-061 | No tracked secrets | M-001 · TKT-01 | static test | P0 | A |

---

## Data and rules

### TC-001 · Yesterday's ledger totals
**Objective.** Acceptance #2: yesterday's money is computed from the simulated trips and comes out exact.

**Precondition.** The scenario is committed and `getDataset()` is available.

**Steps.**
1. Call `yesterday()`.

**Expected.**
- 17 trips.
- Freight ₹4,12,000, diesel ₹1,58,300, tolls ₹38,900, allowance + other ₹28,400, profit ₹1,86,400.
- The ledger bar splits 38.4% / 9.4% / 6.9% / 45.3%, summing to 100.
- Exactly 6 of the 17 trips are on routes through the `udaipur` stretch.

### TC-002 · Yesterday's unaccounted breakdown
**Steps.**
1. Read `yesterday().flags`.

**Expected.**
- `[['0926-04','R1',38,3420,'high'], ['0927-02','R2',50,4500,'likely'], ['0926-11','R3',39,3510,'check']]`
- Total ₹11,430, which is 127 L.
- The other 14 trips have no flag.

### TC-003 · Trip 0926-04 (R1): evidence, timeline and ledger (data + UI)
**Steps.**
1. Call `getTripView('0926-04')`.
2. Open `/trips/0926-04` at 1440 and at 375.

**Expected: head**
- RJ14 GB 4521 · "Jaipur → Delhi (Okhla)".
- "Sat 26 Sep, 9:05 PM → Sun 27 Sep, 6:40 AM · 286 km on NH48 · 24 t cement · Driver Ramesh Kumar".
- Profit ₹13,240, with "₹3,420 below this route's normal of ₹16,660".

**Expected: flag card**
- "Stationary fuel drop", High confidence.
- "38 L diesel unaccounted", ₹3,420 at ₹90 / L.
- Evidence lines, each with its source:
  - "Fuel fell 168 → 130 L in 26 minutes" · Fuel sensor
  - "Parked with ignition off, 2:08–2:44 AM" · GPS · ignition
  - "1.6 km off NH48; nearest pump is 3.1 km away" · Geofence
  - "Same stretch flagged 4 more times this month" · Fleet history
- Why High: "…±2 L… about 19×…".
- Driver's side: "Ramesh hasn't been asked yet". The neutral message quotes "Fuel dropped 38 L near Behror at 2:14 AM on 27 Sep."

**Expected: timeline (10 events)**

| Time | Event |
|---|---|
| 9:05 PM | |
| 10:40 PM | |
| 11:48 PM | ₹705 |
| 2:08 AM | |
| 2:14 AM | −38 L |
| 2:44 AM | |
| 3:10 AM | ₹12,600; bill 140 L, tank rose 138 L |
| 3:31 AM | ₹725 |
| 5:52 AM | ₹710 |
| 6:40 AM | fuel 230 L |

**Expected: ledger**
- Freight ₹28,000.
- Diesel −₹10,620 (118 L × ₹90), of which −₹3,420 is unaccounted (38 L).
- Tolls −₹2,140 (3 plazas), allowance −₹1,200, loading and other −₹800.
- Profit ₹13,240.

**Expected: route chart.** 14 bars, with the reference line at ₹16,660.

### TC-004 · Trip 0927-02 (R2)
**Expected.**
- Trip: RJ14 GA 1182, Vikram Choudhary. Ahmedabad → Jaipur, 662 km, Sun 27 Sep 3:50 AM → 7:00 PM.
- R2 flag at the Kishangarh pump, 4:50 PM: bill 250 L against a tank rise of 200 L, so 50 L and ₹4,500, confidence Likely.
- Driver's side shows he replied.
- The page uses the R2 chart variant.

### TC-005 · Trip 0926-11 (R3)
**Expected.**
- Trip: RJ14 GC 3309, Anil Bairwa. Jaipur → Bhiwandi, 1,150 km, 26 Sep 4:30 AM → 27 Sep 8:10 AM.
- Used 364 L against a normal 325 L: 39 L (12%), ₹3,510, confidence Check.
- Load 26 t (usual 22 t).
- The evidence includes "spread across the trip, no single stop".

### TC-006 · September diesel
**Expected.**
- 212 trips ended between 1 and 27 Sep.
- Diesel unaccounted: 412 L, worth ₹37,080, in 9 incidents.
- Incidents fall on days 5, 9, 12, 17, 21, 23 and 27. The cumulative series matches `technical-plan.md` §4.3 exactly.
- 5 of the 9 are on the Behror stretch: 0905-03, 0912-05, 0921-09, 0923-02, 0926-04.
- UI: the KPI card shows "412 L", "+217 L this week", "Worth ₹37,080" and "Behror stretch · 5 of 9".

### TC-007 · September flags
**Expected.**
- 23 flags: 18 confirmed, 3 waiting, 2 wrong. The wrong rate is 9% against a 10% limit.
- Flagged ₹58,240; recovered ₹21,600 (37%).
- Weekly flagged / recovered, with bricks:

  | Week | Flagged | Recovered | Bricks |
  |---|---|---|---|
  | 1 | ₹9,480 | ₹6,300 | 6 / 9 |
  | 2 | ₹14,200 | ₹8,100 | 8 / 14 |
  | 3 | ₹12,030 | ₹5,400 | 5 / 12 |
  | 4 | ₹22,530 | ₹1,800 | 2 / 23 |

- Clean days in 1–24 Sep: 3, 10, 19 and 24.
- UI: the wrong-flags card shows "2 of 23 flags", "9% · limit 10%", "Both cleared by the driver's side" and "3 waiting on you".

### TC-008 · Trucks table and Anil's September
**Expected.**
- Ranks 1–5 and 22–24 match `technical-plan.md` §4.3 exactly: plate, driver, km, ₹/km, unaccounted and current status.
- The gap row reads "16 more trucks between ₹16.9 and ₹25.0 per km".
- Anil: 125 L, worth ₹11,250, from trips 0926-11, 0917-06 and 0909-03.
- "All 24 trucks" expands to 24 rows, sorted by ₹/km.
- The profit-per-km card shows ₹31.8 best (RJ14 GC 7710), "Mahesh Meena · no flags" and "Bottom 3 all flagged".

### TC-009 · Last 7 days
**Expected.** 21–27 Sep: 217 L and ₹19,530, over 5 trips: 0926-04, 0927-02, 0926-11, 0923-02, 0921-09.

### TC-010 · 14-day profit series and the clean day
**Expected.**
- Daily profit for 14–27 Sep equals the §4.3 series exactly.
- 24 Sep: 17 trips, 0 flags, ₹1,94,800. It is September's 4th clean day.
- UI:
  - The brief's bar chart lights yesterday.
  - `?state=clean` shows "All 17 trips add up. ₹1,94,800 earned, nothing unaccounted." and "That's the 4th clean day this month."

### TC-011 · Rule thresholds and detection completeness
**Boundaries** (on synthetic trips):

| Rule | Doesn't fire | Fires |
|---|---|---|
| R1 | 15.0 L; inside a pump geofence; moving at 5 km/h | 15.1 L |
| R2 | 8.0% | 8.1% |
| R3 | 11.9% | 12.0% |
| R4 | 6.0% | 6.1%, or a 10.1 km detour |
| R5 | ₹49 | ₹50 |

**Completeness** (property test): the detected flags equal the scenario's injections exactly: 23 flags, none missed, none extra.

**Confidence:** flag 1 is High, flag 2 Likely, flag 3 Check.

### TC-012 · Determinism
**Expected.**
- Two fresh loads of the dataset give the same SHA-256.
- `lib/data` and `lib/brief` contain no `Date.now(`, no `Math.random(` and no argument-less `new Date()`.

### TC-013 · Physical plausibility
**Expected for every trip.**
- Integrating speed over time gives the actual km, within ±2%.
- Fuel never goes below 0 or above the 400 L tank capacity.
- No truck has overlapping trips.

**Expected for the balancer values.**
- Toll tariff: ₹100–1,500.
- Local-run km: 20–150.
- "Other": ₹200–4,000.
- Freight per km: within the route's band.

**Expected for the §4.9 resolutions.**
- Trip 0917-06 starts and ends on 17 Sep.
- Trip 0926-04's derived moving speed averages about 36 km/h.

### TC-014 · Wording guard
**Steps.**
1. Scan the string literals in `lib/`, `components/`, `app/` and `content/`.

**Expected.**
- Nothing matches `/\b(theft|stolen|stole|thief)\b|चोरी|चुराया|चोर/i`.
- The same guard covers the Ask fallback templates (TC-046) and model answers (the EVAL scorer).

### TC-015 · Brief template in Hindi and English
**Steps.**
1. Call `renderBrief('2026-09-27', 'hi')` and `renderBrief('2026-09-27', 'en')`.
2. Call `renderMessage(…)`.

**Expected.**
- The output equals the `data-hi` / `data-en` strings in `final/brief.html` and `message.html`, with the numbers computed. For example:
  - "बहरोड़ के पास खड़े ट्रक में 38 L डीज़ल का हिसाब नहीं — रात 2:14 बजे"
  - "Fuel bill says 250 L, but the tank rose only 200 L — Kishangarh"
  - the confidence words पक्का / शायद / जाँचें
  - "बाकी 14 ट्रिप का हिसाब ठीक है"
- `docs/exec/hindi-review.md` is generated.

## UI, flows and accessibility
Playwright runs at three widths: desktop 1440, tablet 768, phone 375.

### TC-020 · Five-step demo path (acceptance #1)
**Precondition.** A preview URL (TKT-15), then the production URL (TKT-16).

**Steps.**
1. On `/message`, tap "Open today's brief".
2. On `/brief`, open item 1.
3. From `/trips/0926-04`, go to Today through the nav.
4. Switch the hero from Scene to Map.
5. Press ⌘K and ask "How much did we earn yesterday, and how much doesn't add up?"
6. Open Why Urja.

**Expected.**
- Every step renders with no console errors.
- The answer contains ₹1,86,400 and ₹11,430 and cites the trips.
- Done by hand, the path takes under 5 minutes.
- Manual part: rehearse it with the network throttled to "Fast 3G".

### TC-021 · Numbers agree across screens (acceptance #2)
**Steps.**
1. Collect every ₹ and litre figure from `/message`, `/brief` (Hindi and English), `/`, `/trips/0926-04` and one fallback Ask answer.

**Expected.**
- Each fact shows the same value everywhere: ₹1,86,400; ₹11,430; ₹3,420; ₹4,500; ₹3,510; ₹58,240; ₹21,600; 17 / 14 trips.
- A static check finds no `₹` followed by a digit in any TSX file under `app/**` or `components/**`.

### TC-022 · No horizontal scroll [TC-UI-RESPONSIVE]
**Steps.**
1. Check each of these at 375, 768 and 1440: `/`, `/?view=map`, `/?view=fleet`, `/brief`, `/brief?lang=en`, `/message`, `/trips/0926-04`, `/why`.

**Expected.**
- `document.documentElement.scrollWidth <= window.innerWidth`.
- Primary actions are visible.
- No text is smaller than 12 px.

### TC-023 · Mobile navigation [TC-UI-MOBILE-NAV]
**Expected.**
- At 375, the menu disclosure opens and reaches Morning brief, Today, Trucks, Trips, Why Urja, The bet and Ask (The bet added by EXE48, 2026-10-07).
- The ⌘K hint is hidden on coarse pointers.
- Primary phone actions have targets of at least 44 px.

### TC-024 · Screen states [TC-UI-EMPTY, TC-UI-ERROR]
**Today and Brief.**
- `?state=loading`: the skeleton, plus "Checking 17 trips … 11 of 17 done".
- `?state=empty`: "No trips finished yesterday.", the computed counts and "Next brief: tomorrow, 7:00 AM".
- `?state=clean`: see TC-010.
- `?state=error`: "Yesterday's trips haven't reached Urja yet." with "6 trucks … Udaipur stretch … The other 11 trips are ready.", plus "Show the 11 ready trips" and "Try again".

**Trip.**
- A loading skeleton.
- "Couldn't load this trip", with a retry button.

**Ask.**
- Answering: "Asking Gemini…".
- Fallback: the deterministic report, "Your question is saved" and "Try again".
- An error state.

**Every error state** says what happened, what to do next and whether anything was lost.

### TC-025 · List ↔ map linking (D4)
**Steps.**
1. On `/`, click row 2 of "Needs your eyes".
2. Click map marker 3.
3. Switch to Fleet.

**Expected: row 2**
- The hero switches from Scene to Map, and row 2 lights up.
- The glass card shows RJ14 GA 1182 / Trip 0927-02.
- The rail knob reads "4:50 PM · bill ≠ tank".
- The map flies there over 1.4 s.

**Expected: marker 3.** Row 3 is selected.

**Expected: Fleet**
- 24 dots: 11 moving, 12 in a yard, 1 in the workshop.
- The glass card reads "24 trucks · On a trip 11 · In a yard 12 · Workshop 1".

**Expected: reduced motion.** The map jumps instead of flying.

**Tags.** The fly assertion is tagged `@tiles`. The selection assertions also run with the map stubbed.

### TC-026 · Ask drawer: keyboard and focus
**Expected.**
- ⌘K (or Ctrl+K) opens the drawer, with focus in the input.
- Tab and Shift+Tab keep focus inside the drawer.
- Esc closes it and returns focus to the Ask trigger.
- While it's open, `main` is inert: nothing on the page can be reached.
- Cite chips are links to `/trips/{id}`.

### TC-027 · Language toggle
**Expected.**
- `/brief` loads in Hindi by default: `lang="hi"`, title "सुबह का हिसाब · Urja".
- Switching to EN changes the copy, `lang`, the title ("Morning brief · Urja"), the aria-labels, and the URL (`?lang=en`).
- `?lang=en` renders English on first paint, server-side.
- `/message` behaves the same way.

### TC-028 · Map unavailable
**Steps.**
1. Block tiles with `page.route('**/basemaps.cartocdn.com/**', abort)`.
2. Open `/?view=map` and `/trips/0926-04`.

**Expected.**
- The map area shows "Map unavailable; every event is in the timeline".
- Selecting a row still updates the glass card.
- No uncaught errors.

### TC-029 · 3D fallback on a software GPU
**Steps.**
1. Run headless Chromium, which renders with SwiftShader.

**Expected.**
- The poster shows, with the scene tag "Reconstruction from GPS + fuel sensor".
- The Map switch works.
- 0 console errors.
- The container has `role="img"` and an aria-label. If a canvas is created at all, it is `aria-hidden`.

### TC-030 · 3D on a real GPU (manual on the Mac + automated dispose check)
**Manual checklist** (`docs/exec/tc-030-manual.md`):
- The composition matches `final/scene.html`: the truck on the left shoulder, the fuel tank lit red, the lamp pool, the light trails.
- Dragging orbits within the limits; there is no zoom or pan.
- Rotate-left, rotate-right and reset work from the keyboard.
- With reduced motion, the camera is static, the trails are frozen and nothing pulses.
- On a phone, there is no drag.
- On an older laptop, frame pacing is acceptable: record a subjective note plus the DevTools FPS reading.

**Automated.** After 10 Today ↔ Trip navigations, at most 1 WebGL context is live (from the debug counter).

### TC-031 · Accessibility scan
**Expected.**
- `@axe-core/playwright` finds no serious or critical violations on `/`, `/brief`, `/message`, `/trips/0926-04` and `/why`, at 375 and 1440.
- Each page has exactly one h1.
- Charts, maps and the scene have descriptive `aria-label`s.

### TC-032 · Keyboard-only pass, 320 px reflow, 200% text (manual, Stage 8)
**Expected.**
- Every action can be reached by keyboard, with a visible focus indicator.
- At 320 px and at 200% zoom, no content is lost and nothing scrolls horizontally, apart from tables and charts.

## Ask Urja behaviour
These tests mock the model. Answer quality is measured separately, in `evals/`.

### TC-040 · Happy path
**Steps.**
1. Mock `fetch` to return valid JSON.
2. POST `{question:"How much did we earn yesterday, and how much doesn't add up?"}`.

**Expected.**
- Status 200, with `mode:"model"`.
- `cites` ⊆ existing trips.
- `provenance` includes model, ms, promptVersion and datasetHash.

### TC-041 · Timeout → fallback
**Steps.**
1. Mock `fetch` to hang for more than 8 s.

**Expected.**
- For a recognised question, a response in about 8 s with `mode:"fallback"` and the deterministic report (₹1,86,400 / ₹11,430).
- For an unrecognised in-scope question, `mode:"saved"`. An off-topic question gets the fixed refusal (`mode:"saved"`, `refusal` set; EXE30).
- The log outcome is `timeout`.

### TC-042 · Upstream errors → fallback
**Cases.** A 429; a 500; a non-JSON body; JSON that fails the schema; a missing key.

**Expected.**
- Each case returns 200 with fallback or saved, and logs the matching outcome.
- The route never returns 500.

### TC-043 · Rate limit and daily cap
**Expected.**
- The 6th request from one IP within a minute gets a 429 with `retryAfterS`, plus a fallback answer if the intent is recognised.
- Past 40 Gemini calls per IP per day, or the global daily budget (`ASK_DAILY_MODEL_BUDGET`, default 300), the model is never called: the mock records no calls. Answers served from the answer cache spend no daily budget, but they still take the per-minute token (EXE31).

### TC-044 · Citation guard
**Expected.**
- A model answer citing `0999-99` has that citation stripped.
- If a data question ends up with 0 valid citations, it falls back. A flag id (`0926-11-R3`) counts as its trip; a cited fleet plate counts only when the answer names that truck (EXE30).
- A forbidden word in the answer triggers the fallback.

### TC-045 · Gemini key hygiene
**Expected.**
- The key travels only in the `x-goog-api-key` header, never in the URL.
- Log lines contain neither the key nor the question text.
- After `pnpm build`, `.next/static` contains no `GEMINI_API_KEY` and no `AIza…` string.
- The client bundle never references `process.env.GEMINI`.

### TC-046 · Fallback intents
**Expected.**
- Each question in EVAL-001..010, and one close paraphrase of each, maps to its intent. The answer's numbers equal the golden values.
- Devanagari digits are normalised.
- The Hinglish question "Vikram ki kal wali trip mein kya gadbad hai?" maps to trip 0927-02.

## Link preview, performance and quality gates

### TC-050 · OG and Twitter metadata and asset [TC-WEB-OG-METADATA, TC-WEB-OG-ASSET]
**Expected.** The server-rendered HTML of `/`, `/why`, `/brief` and `/trips/0926-04` has:
- `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:image:width` (1200), `og:image:height` (630) and `og:image:alt`;
- `twitter:card` = `summary_large_image`, plus `twitter:title`, `twitter:description` and `twitter:image`;
- absolute `https://` URLs on the deployment host.

`og.png` returns HTTP 200, measures 1200×630 and is under 500 KB.

### TC-051 · Live unfurl [TC-WEB-OG-UNFURL] (manual)
**Steps.**
1. Paste the production URL into LinkedIn Post Inspector and into opengraph.xyz.

**Expected.**
- Title, description and image all match. Add `?v=N` to force a re-scrape.
- If an inspector is unavailable, record BLOCKED with the reason, not PASS.

### TC-055 · Performance budget
**Expected.**
- `/` first-load JS is at most 200 KB gzip, per the `next build` output.
- No route's initial scripts include `three` or `maplibre`.
- Lighthouse mobile on the preview:
  - `/`: LCP ≤ 2.5 s, CLS ≤ 0.1.
  - `/why`: LCP ≤ 2.5 s.

### TC-060 · `pnpm verify` green in CI (acceptance #6)
**Expected.**
- GitHub Actions passes typecheck, lint, unit tests and build on the release commit.
- The eval harness's unit tests (the scorer) run as part of it.

### TC-061 · No tracked secrets
**Expected.**
- The secret-scan test passes: no tracked file contains `AIza[0-9A-Za-z_-]{35}`.
- `.env` and `.env*.local` are untracked.
- A deliberately planted fake key makes the test fail.

---

## Coverage map (acceptance criteria → cases)
| Acceptance | Cases |
|---|---|
| #1 Demo path on the deployed URL | TC-020 (preview, then production) |
| #2 Every ₹ computed and consistent | TC-001–TC-013, TC-021 |
| #3 Ask ≥ 9/10 grounded, 3 off-topic handled, < 4 s, fallback | EVAL-001–EVAL-013 (`evals/`), TC-040–TC-046 |
| #4 375 / 768 / 1440 and four states | TC-022, TC-024 (+ TC-023, TC-031, TC-032) |
| #5 Link preview | TC-050, TC-051 |
| #6 Typecheck, lint, tests | TC-060 (+ TC-061) |
