# Design Specification — Urja

**Status:** **Approved 2026-09-28** (Stage 4) · direction B **"Lamplight"** with the 3D truck scene · **Ticket:** TASK-2 · **Inputs:** `Solution-PRD.md`, `Discovery-PRD.md`, `decisions.md`
**Approved mockup (visual truth for Stages 7–8):** `.design/exploration/final/` · gallery `.design/exploration/index.html` · OG `.design/exploration/og/` · superseded direction A kept in `.design/exploration/option-a/`
**Surface classification:** Core (Today, Trip, Brief, Message, Ask) + one Web page (Why Urja, the public pitch). Not a Product Journey: no signup or onboarding exists.

---

## Design Freeze (2026-09-28)
- **Approved by** Tushar ("Approved go ahead"), after asking for the TerraFlux look and a TerraFlux-style 3D truck in the dashboard.
- **Frozen:**
  - the IA and the demo path (§3, §5);
  - verdict-first page heads;
  - the Lamplight visual language: tokens (§12) and the rule of light (§1);
  - the component set (§13);
  - the Today hero, a 3D scene with a Scene | Map | Fleet switch (§26);
  - the phone task model: the Brief is home, dark (§16);
  - the motion concept (§15) and the OG direction (§24).
- **Implementation may fix without review:** pixel, browser, accessibility and performance issues.
- **Goes back to design review:** any change to the IA, the hero, the visual direction, the CTA hierarchy, the motion concept or the 3D concept.
- **3D freeze:**
  - camera: a high three-quarter view;
  - composition: the truck on the left shoulder of NH48, left of the glass card, traffic light-trails behind, the lamp pool, the fuel tank lit red;
  - interaction: drag to orbit, mouse and trackpad only, within limits; no zoom, no pan;
  - fallback: the poster;
  - phone: no drag, lower pixel ratio;
  - reduced motion: static camera, frozen trails, no pulse;
  - software GPU detected: show the poster.

## 1. Design Intent
- **Direction: "Lamplight"** (TerraFlux-inspired).
  - The interface sits in the dark, and only what needs the owner's eyes is lit: the leaked rupees, the selected flag, yesterday's bar, the primary action.
  - The look: a near-black warm canvas, amber lamp light, focus-and-context bar charts, pill navigation, glass cards only over imagery, and tick rails.
  - Still evidence-led and rupee-first: every screen opens with a verdict sentence that contains the number, and puts the proof underneath.
- **Why this direction.**
  - The user asked for the TerraFlux look (FocoTik on Muzli and Behance) to get a "million dollar app" feeling.
  - It fits the product. *Urja* means energy. Trucks run at night; the flagged moment happened at 2:14 AM beside a lit highway. The lamp is the munshi's lamp over the hisaab.
- **Rule of light (semantic, not decorative).** Glow appears only on:
  - the verdict amount;
  - the selected flag (row bar, map marker, light pool);
  - the lit bar in each chart;
  - lit numbers (profit);
  - the primary button;
  - the brand mark;
  - the 3D truck's marker lamps and fuel tank.

  Nothing else glows.
- **Anti-direction.**
  - generic AI SaaS: purple or blue gradients, orbs, sparkles, neon;
  - glow as decoration;
  - KPI walls with no verdict (the Power BI and Excel references);
  - Grafana gauge walls;
  - siren "THEFT DETECTED" tone;
  - leaderboards that shame drivers;
  - a rendered "live map" passed off as data. The 3D scene is labelled as a reconstruction, and the real map is one click away.
- **Signature details (product-specific):**
  - the Indian yellow commercial number plate everywhere, including on the 3D truck;
  - Indian digit grouping (₹1,86,400);
  - Hindi-first on the phone;
  - the day's ledger as one bar;
  - "When Urja was wrong" as a first-class number;
  - the 3D truck with its fuel tank lit red.
- **Generative and 3D assets:** one procedural three.js scene (no downloaded models, no licensing questions) and its rendered poster, `final/assets/truck-scene.png`. The poster is reused as the loading state and fallback, the Why Urja hero and the OG backdrop.

## 2. User Context — mental model
| | Owner of 10–100 trucks |
|---|---|
| Goal | Know by morning which trips lost money and why; act before the driver's next trip |
| Knowledge | Knows every route, pump, dhaba and diesel price; does not read dashboards |
| Vocabulary | trip, bhada (freight), diesel, toll/FASTag, bhatta (driver allowance), munshi, **hisaab** (the accounts) |
| Conventions | WhatsApp, phone calls, the paper khata, the munshi's end-of-trip reconciliation |
| Uncertainty | Sensor glitch, or diesel actually taken? Heavy load, or bad driving? |
| Fear | Accusing a loyal driver and losing him; being cheated without knowing |
| Success signal | "The hisaab matches." Money recovered. |
| Recovery | Driver explains → owner accepts or rejects → flag resolved |

## 3. Core User Journeys
1. **Morning check (phone):** 7 AM message → "Open today's brief" → tap a trip → evidence → "Ask Ramesh on WhatsApp".
2. **Desk review (desktop):** Today → the 3D scene of the top flag and "Needs your eyes". Clicking a row flies the map to it. Then Trip evidence → resolve or ask the driver.
3. **Question:** the ⌘K Ask bar or the phone dock → Ask Urja in Hindi or English → an answer with cited trips → open a trip.
4. **Month review:** Today → the September cards → trucks ranked by ₹/km → a truck. The Truck Report Card is the first cut if time runs short.
5. **Interview demo (five minutes):** Message → Brief → Trip → Today (the 3D scene, then Map) → Ask (live) → Why Urja.

## 4. Emotional Journey
| Step | Intended | Risk to prevent | Design response |
|---|---|---|---|
| Message | Oriented, in control | "Another noisy alert" | One headline, 3 lines, "the other 14 are fine"; the preview shows the drop |
| Brief | Clear-headed | Panic, anger at drivers | Neutral words ("doesn't add up"), confidence on every line |
| Today, first look | "This is serious software" | Spectacle over substance | The verdict is the h1; the scene shows *the* moment (tank lit, 2:14 AM); the glass card carries the facts |
| Trip evidence | Convinced by facts | Suspicion of the tool | Evidence with sources; "Why high"; clean stops marked "checked" |
| Ask driver | Fair, confident | Guilt, confrontation | Pre-written neutral message; "nothing is deducted until you decide" |
| Ask Urja | Curious, capable | Being misled by AI | Citations, scope, model, "Urja can be wrong" |
| **Peak** | "Oh: 2:14 AM, parked, 38 litres." | — | Fuel falls while speed is zero; the map pin, the rail knob and the timeline agree |
| **End** | Settled | Dangling worry | Clean-day state "All 17 trips add up" in lamp light; resolved flags leave the list |

## 5. Information Architecture
- **Desktop:** Today (home) · Trucks · Trips (→ Trip evidence) · Why Urja, as pill navigation. **Ask Urja** is the search-style bar in the top bar, opened with ⌘K. It is never a page.
- **Phone:** the Message is the entry and the Brief is home. Trip evidence is one tap from the brief. A menu disclosure reaches Today, Trucks, Trips, Why Urja and Ask. On the brief, Ask lives in a bottom dock.
- **Objects:** Fleet → Truck (plate) → Trip → Flag (rule, confidence, evidence, driver's side) · Ledger (per trip, per day).

## 6. Screen / Flow Architecture
| Screen | File | States |
|---|---|---|
| 7 AM message | `final/message.html` | working |
| Morning brief (phone, dark) | `final/brief.html` | loading · empty · clean · error · working |
| Today (desktop) | `final/index.html` (`?map`, `?fleet`, `?ask`, `?still`) | loading · empty · clean · data-late error · working |
| 3D scene, full-bleed (poster source) | `final/scene.html` | loading = poster · ready |
| Trip evidence | `final/trip.html` | loading · error · working |
| Ask Urja drawer / dock | in `index.html`, `brief.html` | idle · answering · answer · fallback · error |
| Screen states | `final/states.html` | reference for all of the above |
| Why Urja (web) | `final/why.html` | static |
| OG image | `og/index.html` | — |

## 7. Attention Architecture (one focal point, then scan order)
- **Message:** headline → preview (fuel drop) → 3 lines → "Open today's brief".
- **Brief:** ₹ earned (14-day bars, yesterday lit) → red "doesn't add up" → the 3 trips (plate → ₹ → sentence → confidence → driver status).
- **Today:** verdict h1 (₹11,430 lit red) → ledger bar → hero, where the tank glow draws the eye and the glass card sits beside it → "Needs your eyes" → September cards → trucks.
- **Trip:** plate and route + ₹ profit (₹ below normal) → flag card → route map with rail → fuel-and-speed chart → timeline → ledger.
- **Ask:** the answer's first sentence (name + plate + ₹) → cited trips → caveat → provenance.

## 8. Cognitive Load
- **Intrinsic (kept):** money reconciliation, which is what the product exists to do.
- **Extraneous (removed):**
  - engineering terms ("CAN", "geofence") become small source labels;
  - no gauges;
  - no per-signal panels.
- **Charts on the home screen (changed from A):** four September cards sit below the fold. They exist because together they tell the metric-and-guardrail story (diesel unaccounted → recovered → when Urja was wrong → profit per km). Each carries a one-line takeaway in its footer, so the chart is never the only message.
- **Deferred:** the full truck list ("All 24 trucks") and the per-truck page.
- **Chunking:** at most 3 flags in the brief and message; the rest become "the other N trips add up".

## 9. Behavioral & Psychological Rationale (all pass the ethical gate)
| Principle | Use | Ethical check |
|---|---|---|
| Von Restorff | One lit primary action per view ("Open the evidence", "Ask Ramesh on WhatsApp") | The primary action is the fair one (ask), never "deduct" |
| Choice overload | 3 flags max per brief | Nothing hidden: "the other 14 add up" |
| Serial position | Flags ordered by confidence, then ₹ | Surest first |
| Recognition over recall | Yellow plates mirror the real plate, on the 3D truck too | — |
| Tesler's law | Urja reconciles; the owner decides | — |
| Peak-End | Peak = aligned evidence; the first look = the 3D reconstruction; end = clean day | The scene carries no fact that isn't also in text |
| Zeigarnik | "3 waiting on you" | True count; no streaks, no nagging |
| Labor illusion | Loading shows real progress ("11 of 17 done") on the tick rail | Only real work is shown |

**Ethical Behavioral Design Gate:**
- [x] serves the owner's goal;
- [x] truthful: no fake urgency, scarcity or metrics, and the scene is labelled "Reconstruction from GPS + fuel sensor";
- [x] every flag can be dismissed, explained or reversed;
- [x] no fear or shame exploitation;
- [x] the easy path is the honest path.

## 10. Production Pattern Research
**TerraFlux** (FocoTik; Muzli and Behance, studied 2026-09-28 from 38 images).
- **Taken:**
  - pill navigation with a glowing active pill;
  - search-style command bar (⌘K);
  - page-head controls;
  - a hero card with a glass info card and a tick-mark rail;
  - focus-and-context bars: one lit gradient bar, dim context, hatched future;
  - brick-block columns;
  - mirrored bars (here the mirror carries meaning: fuel above the line, speed below);
  - a light edge on panels;
  - status chips with a left bar, and delta chips;
  - Inter;
  - the 3D truck hero.
- **Not copied:**
  - the rendered "Live Map" (ours is a real MapLibre map, and the scene is labelled);
  - generic KPIs ("Total Soil Moved");
  - glowing marketing typography inside the app (it is kept for the Why Urja page only).

**Kept from the first pass (Mobbin, 2026-09-28):**
- Flighty: verdict banner, planned vs actual.
- Strava: events pinned on the route; a dashed reference line.
- Mercury: net change above a dense table.
- CRED: Indian ₹ formatting; AI provenance footnotes.
- Perplexity: source chips naming *records*.
- WhatsApp: structured bubbles.

## 11. Anti-References
1. The Power BI and Excel fleet dashboards in `references/`: KPI tiles, 3D pies, "Total Revenue" everywhere, and no answer to "what should I do?"
2. The Grafana OBD2 dashboard in `references/`: a wall of gauges for engineers.
3. Siren "theft detected" alerts: accusatory UI that turns a sensor reading into a verdict about a person.
4. TerraFlux's rendered "live map": beautiful, but it pretends to be data. Urja keeps the real map one click away and labels its scene.

## 12. Design System (`final/lamp.css`)
**Colour (OKLCH, semantic tokens; one dark theme on every surface):**
| Token | Value | Job |
|---|---|---|
| `--bg` | 0.130 0.003 60 | page, the night |
| `--surface-1/2/3` | 0.172 / 0.212 / 0.250 | panels / chips, controls / active control, keycaps |
| `--line`, `--line-soft` | 0.290 / 0.225 | hairlines |
| `--fg`, `--fg-muted`, `--fg-subtle` | 0.975 / 0.760 / 0.625 | text ramp |
| `--lamp` (≈ #EC7C22), `--lamp-deep` (≈ #A4510E), `--cream` | 0.705 0.166 53 / 0.528 0.130 52 / 0.935 0.045 75 | brand, attention, primary action; gradient stops |
| `--glow`, `--glow-soft` | lamp at 34% / 13% | the rule of light only |
| `--loss` | 0.690 0.190 27 | money leaked, the fuel drop **only** |
| `--gain` | 0.790 0.160 150 | profit, clean, "under the limit" **only** |
| `--plate` | 0.870 0.165 95 | number plates only |

**Measured contrast (WCAG 2.2, `Dev/.scratch/urja-shots/contrast-b.mjs`):**
- All 23 text pairs pass AA.
- Lowest: `lamp-ink` on the button's darkest stop, 4.88:1; `fg-subtle` on `surface-2` chips, 4.94:1.
- Links (`lamp`) on panels: 6.4–7.3:1. Plate: 12.93:1.
- Both gradient elements (the button and the rank badge) have a solid `background-color` fallback.

**Typography:**
- **Inter** (opsz 14–32, 300–700) for Latin UI; **Anek Devanagari** for Hindi. Plates use Anek Devanagari at 86% width.
- Numbers are set in a regular weight (TerraFlux), and tables use tabular figures.
- Scale:
  - verdict: `clamp(1.75rem, 1.05rem+2.1vw, 2.9rem)`, weight 400, line-height 1.12, max 33ch;
  - KPI number: `clamp(1.6rem, 1.2rem+1vw, 2.1rem)`;
  - h2: 1.125rem;
  - body: 0.95rem;
  - sm: 0.8125rem;
  - xs: 0.75rem. The floor is 12px.
- Headings use `text-wrap: balance`.

**Spacing:** 4px base (4 · 8 · 12 · 16 · 18 · 22 · 28 · 72).

**Radius:** 16 (panels) · 12 (glass, rows) · 8 (controls) · 6 (chips) · 5 (plates).

**Icons:** one family (Lucide-style, 1.75 stroke) as an SVG sprite (`final/icons.js`). Used only on nav pills, card titles, evidence lines and map controls.

**Surfaces allow-list:**
| Surface | Where |
|---|---|
| Panel (vertical gradient, light on the top-left edge) | real containers: hero, eyes list, KPI cards, table, flag card, chart, timeline, ledger |
| **Glass** | only floating over imagery: the map/scene glass card, rail box, legend, Ask dock, top bar |
| **Glow** | the rule of light (§1) |
| Elevation shadow | the Ask drawer and the mobile menu only |

## 13. Component Architecture (need → info → interaction → component)
| Need | Info model | Interaction | Component |
|---|---|---|---|
| "Which truck?" | plate string | none | **Plate** |
| "How much?" | ₹, sign, meaning | none | **Money** (en-IN; `−` for costs; loss/gain colour + words; `lit`/`lit-loss` for the focal amount) |
| "How sure?" | High / Likely / Check (पक्का / शायद / जाँचें) | none | **Confidence meter** (3 lit bars + word) |
| "What state?" | label + state | none | **Status chip** (left bar + dot + text), **Delta chip** (left accent bar) |
| "Does the day add up?" | freight = diesel + tolls + other + profit | none | **Ledger bar** (one stacked bar, profit lit) + equation legend |
| "Where / when did it happen?" | the flagged moment | Scene / Map / Fleet; drag to orbit | **Hero card**: 3D scene (§26) or tilted night map; **Glass card** (plate, trip, facts, ₹, "Open the evidence"); **Tick rail** (5-min ticks: moving, stopped, flagged, refuel; knob at the moment) |
| "What needs me?" | truck, rule, where/when, ₹, confidence, driver status | row → selects on the map; "Evidence" → trip | **Eyes row** (number badge, plate, lit left bar when selected) |
| "How's the month?" | one number + chart + footer takeaway | none | **KPI chart card**: bars (lit / dim / hatched / bracket), bricks, unit squares, meter with a limit |
| "Why should I believe it?" | rule, title, ₹, evidence + source, why-confidence, driver panel | ask driver · mark explained · call / message | **Flag card** |
| "Where did fuel go?" | fuel litres and speed over time; the drop window; expected line | none (production: scrub synced with the map) | **Fuel-and-speed chart** (mirrored bars; desktop + phone variants) |
| "What happened?" | time-ordered events with values | none | **Timeline** (dots: lamp = moves, green = checked, red = flag) |
| "Ask anything" | question, answer, cited records, scope, model, time, caveat | type, suggested chips, cite → trip | **Ask drawer / dock** |
| Language | hi / en | toggle | **Language toggle** (sets `lang`) |

## 14. Interaction Design
- **List ↔ map:**
  - Selecting a "Needs your eyes" row (or a numbered map marker) moves the lit bar, updates the glass card and rail, and flies the map to that trip.
  - Flags 2 and 3 switch the hero from Scene to Map, because the scene reconstructs flag 1.
- **Hero switch:**
  - Scene (default): the 3D reconstruction.
  - Map: the flagged trips on the tilted night map, with the planned route dashed.
  - Fleet: 24 trucks, with the 3 flags numbered.
  - Full-screen button.
- **Fitts:** primary buttons are 40px on desktop and 44–48px on the phone; whole rows are the target.
- **Hick:** 3 flags, 3 suggested questions, 2 driver-side actions, 3 hero views.
- **Jakob:** WhatsApp bubble conventions; accounting conventions (right-aligned figures, total rule); a search-bar Ask with ⌘K.
- **Keyboard:** ⌘K opens Ask and Esc closes it. Focus goes to the input on open and returns to the trigger on close. The flag markers and rows are buttons.

## 15. Motion Design
| Motion | Spec | Purpose |
|---|---|---|
| Ask drawer | translateX 102%→0, 240 ms, cubic-bezier(.2,.8,.2,1) | spatial: it comes from, and returns to, the right edge |
| Scrim | opacity, 180 ms | figure-ground |
| Map fly-to on selection | 1.4 s, curve 1.3 | continuity: where the selected flag is |
| Flag marker ping | ring scale 1→2.3, 2.2 s loop | state: this one needs attention |
| 3D traffic trails | 20–32 m/s along the lanes | narrative: the highway keeps moving; the truck doesn't |
| 3D tank pulse | 2.3 s sine on the emissive and the red pool | state: the evidence |
| 3D camera sway | ±0.1 rad over about 28 s; pauses 6 s after a user drag | life without distraction |
| Hover | background/border change | affordance |

**Reduced motion:**
- no ping and no fly-to (jump instead);
- 3D: static camera, frozen trails, no pulse;
- all CSS transitions off.

**Scroll:** native on every surface; no scroll-linked effects or reveals. The scene renders only while visible, and pauses when the tab is hidden.

## 16. Responsive Behavior
- **Phone (≤760px):**
  - The owner's home is the **Brief** (dark; Hindi first).
  - **Today** stacks in this order: verdict → ledger bar → "Needs your eyes" (with Evidence links) → hero (scene or map; no glass card, no scene tag, no drag, lower pixel ratio) → September cards one per row → reduced truck table.
  - **Trip** puts the flag card first, then the map (legend at top, rail at bottom), the phone fuel chart, the timeline and the ledger.
  - Navigation is a menu disclosure. Keyboard-shortcut hints are hidden on touch.
- **Tablet (761–1180px):**
  - The hero stacks with the list first.
  - KPI cards go 2 × 2 and the nav pills show icons only.
- **Desktop:** as mocked.
- **Verified (rendered with puppeteer + Chrome, true mobile emulation):**
  - no horizontal scroll at 375 / 768 / 1440 on message, brief (hi/en), Today (scene, map, fleet) and Trip;
  - the 3D scene rendered on the Mac GPU (Metal) at 1440 and 375.
- **Not yet verified (Stage 8):** 320px reflow, 200% text, and a keyboard-only pass.

## 17. Accessibility (WCAG 2.2 AA)
- [x] Contrast measured; all 23 pairs pass (§12).
- [x] Colour independence: confidence = bars + word; money = sign + words + colour; chips = bar + dot + text; rail states are explained in its header; chart meaning is in `aria-label` and footers.
- [x] Semantics:
  - one h1 per page, landmarks, real tables;
  - `role="img"` with a descriptive `aria-label` on the scene, maps and every chart;
  - `aria-live` on the brief's numbers and the glass card;
  - `lang` switches with the toggle.
- [x] The 3D scene is supplementary. Everything it shows is also text: the eyes row, the glass card, the trip page. Its canvas is `aria-hidden`, and the container carries the description.
- [x] Targets: ≥ 44px for primary phone actions; ≥ 24px floor elsewhere.
- [x] Reduced motion defined (§15).
- [ ] **Focus trap in the Ask drawer**, with `inert` on the page behind: Stage 7.
- [ ] **320px reflow, 200% text and a keyboard-only pass on the built app:** Stage 8.
- [ ] **3D keyboard equivalents** (rotate-left/right and reset buttons): Stage 7. Rotating is optional, never needed for a task.

## 18. State Design (every data-backed view)
| View | Loading | Empty | Error | Working |
|---|---|---|---|---|
| Today / Brief | skeleton + real progress on the tick rail ("11 of 17 done") | "No trips finished yesterday" + where trucks are + next brief time | **data late**: "6 trucks haven't sent data since 2 AM… nothing is lost… the other 11 are ready" + show ready / retry | flags + clean line; the **clean day** is its own lit success state |
| 3D scene | **poster immediately** (`assets/truck-scene.png`) | — | WebGL fails or a software GPU is detected → the poster stays, and Map is one click away | live scene |
| Trip | skeleton of the head + flag card | n/a | "Couldn't load this trip" + retry | as mocked |
| Ask Urja | a single truthful status "Asking Gemini…" | suggested questions | **fallback:** a deterministic report for recognised questions (e.g. "21–27 Sep: 217 L unaccounted, ₹19,530, 5 trips" with cites); otherwise "your question is saved" + retry | answer + cites + provenance |
| Maps | the container with its legend | — | tiles fail → "Map unavailable; every event is in the timeline" | as mocked |

## 19. Trust & Transparency (incl. AI epistemic UX)
- Every flag shows its **rule**, its **evidence with a source** for each line, and **why** its confidence is what it is.
- **Wording:** "unaccounted" / "doesn't add up", never "theft"; low confidence says "Check".
- **Driver's side** on every flag. Nothing is deducted automatically, and the message to the driver is shown before it is sent.
- **"When Urja was wrong: 2 of 23 (9%), limit 10%"** is shown on Today. The guardrail is visible to the owner, not only to the PM.
- **The 3D scene is labelled** "Reconstruction from GPS + fuel sensor", so it is never mistaken for a camera.
- **Ask Urja** cites records, and states its scope, model, response time, and that it can be wrong.
- **Honest prototype:** the Why Urja page says what is simulated and that this isn't a Bytebeam product.

## 20. Error & Recovery Strategy
Blame the system, name the fix, preserve the work. Every error says what happened, what to do next, and whether anything was lost. Recovery is always a visible button, never a vanishing toast. Money is never cute: no jokes near ₹.

## 21. Interaction Cost
- **Morning check:** notification → "Open today's brief" (1) → trip (2) → "Ask Ramesh on WhatsApp" (3).
- **Desk review:** "Open the evidence" on the glass card (1), or an eyes row → Evidence (1–2) → ask driver (2–3).
- **Ask:** ⌘K (1) → type → Enter (2). A suggested chip is 1 tap.

## 22. UX Risks & Assumptions
- **ASSUMPTION A1–A3** (Discovery-PRD), to be checked in field conversations by 2026-10-01.
- **Dark phone in sunlight:** dark UIs are weaker outdoors. A "day" theme is the first fallback if field talks show owners reading outdoors. Not built.
- **3D performance:** the scene needs a hardware GPU. Mitigated by the software-GPU guard, the poster, render-when-visible and a pixel-ratio cap. On weak devices it is still a risk, so Stage 9 tests it on an older laptop and phone.
- **Hindi copy** needs a native-speaker review.
- **WhatsApp Business template limits:** not yet checked against Meta's rules.
- **Carto basemaps** need attribution and have limits.
- **Fuel-sensor noise:** the ±2 L figure is illustrative.

## 23. Validation Plan
1. **Field test:** show the 7 AM message and brief to 2–3 transporters and ask "what would you do next?"
2. **5-second test** on Today (with the scene) and on the Brief: "what is this page telling you?" If people describe the truck but not the ₹11,430, the verdict is losing to the scene. The fix would be to default the hero to Map, which returns to design review.
3. **Native Hindi read-through.**
4. **Stages 8–9:** critique against this file and `final/`; responsive, state, accessibility and 3D cases (§26); Ask Urja on 10 + 3 questions.

## 24. Design QA Checklist
**Nielsen lens:**
- status visible (reconciled at 6:55 AM; real loading progress);
- real-world language;
- user control;
- consistency;
- error prevention;
- recognition over recall;
- minimalist;
- recovery;
- help ("Why high", Why Urja).

**Anti-AI-Slop Review Gate:**
- **Structure:**
  - [x] Grayscale test passes: verdict sentences, tables and ledgers carry the hierarchy without colour or glow.
  - [x] primary goal obvious · [x] hierarchy clear · [x] task model coherent.
- **Specificity:**
  - [x] Fails the 20-SaaS swap test: plates, lakh grouping, Hindi, NH48 trip evidence and the lit fuel tank can't belong to another product.
  - [x] domain terms · [x] anti-direction explicit (§1).
- **Components:**
  - [x] No card-everything: panels only for real containers (§12).
  - [x] Badges are semantic. [x] Icons are one family, used for recognition.
- **Visual:** the items below are present **with justification.**
  - **Glow:** the semantic rule of light (§1), which is the core of the user-requested TerraFlux direction.
  - **Glass:** only over imagery.
  - **Gradients:** lit bars (the focus) and the primary button, each with a solid fallback.
  - **Near-black + one accent:** amber is Urja's "energy" and the only action colour.
  - **Radius:** intentional (16/12/8/6/5). [x] Shadows only on overlays.
- **KPI cards:** 4, each a real metric with a definition and a takeaway footer; they are the metric-and-guardrail story, not vanity.
- **Copy:**
  - [x] no AI marketing language · [x] CTAs name the action;
  - [x] metrics are real within the simulated dataset and consistent across screens. Two A-version bugs were fixed: the Today date (Mon 28 Sep) and Anil's 125 L (₹11,250).
- **AI:** [x] truthful processing states · [x] provenance · [x] uncertainty · [x] the consequential action (message to driver) is previewed.
- **Responsive:** [x] the phone has its own task model · [x] tablet · [x] desktop.
- **Motion:** [x] every animation has a stated purpose (§15) · [x] reduced motion defined.
- **Scroll:** [x] native everywhere.
- **Spatial 3D:** see §26. The user **explicitly overrode the 3D necessity gate** on 2026-09-28: "supersede all the rules and include the 3D truck" / "It will bypass all rules". The remaining 3D items are still met, for robustness.

**Detector (`npx impeccable detect .design/exploration/final`):** 56 → **48** findings after fixes:
- em-based units made fixed-size;
- banner tracking cut to 0.04em;
- solid fallbacks behind the gradients.

Remaining, all justified:
- **45 × `dark-glow`:** the rule of light, the user-requested direction.
- **3 × `overused-font` (Inter):** the reference's typeface, chosen for the look the user asked for. Identity is carried by the plates, Hindi, the rule of light and the 3D truck.
- **Advisory, 4 × `gpt-thin-border-wide-shadow`:** the active nav pill's glow (TerraFlux's active state) and the drawer's overlay elevation.

**web-deliverables design gates:**
- [x] responsive strategy decided and rendered at 375/768/1440;
- [x] four screen states (`final/states.html`);
- [x] OG mockup (`og/index.html`).

**OG image:**
- Archetype: typography first, plus one product fragment.
- Content: "Where did the diesel go?"; the RJ14 GB 4521 plate; a fuel-drop mini chart (red drop, lit refuel); ₹3,420; "An AI munshi for Indian fleet owners · a concept for Bytebeam"; the truck poster as a dark backdrop.
- Thumbnail test at 30%.
- OG anti-slop gate:
  - [x] not a homepage screenshot · [x] not a mini-webpage · [x] no purple gradient or orb;
  - [x] one enlarged fragment · [x] no fake business metrics (a labelled sample from the fictional fleet);
  - [x] one focal point · [x] readable at thumbnail size · [x] understood in about 2 s.

## 25. Web Experience — Why Urja only
```yaml
web_experience:
  audience: Bytebeam interviewer and anyone they forward the link to; problem-aware, product-literate, skeptical of AI hype; desktop first
  user_need: "Judge in 3 minutes whether this candidate finds real problems and owns outcomes"
  business_goal: the interviewer remembers the problem, the user, the metric + guardrail, and the Bytebeam fit
  conversion: primary "See the 7 AM brief" · secondary "Open a flagged trip"
  narrative: heard → owner → market gap → built on Bytebeam → metric/guardrail → first 90 days → what's real
  visual_direction: Lamplight, editorial variant (TerraFlux case-study chapter titles with a soft glow)
  anti_direction: SaaS landing template (centered hero + 3 feature cards + logo wall)
  hero: the truck poster + the typographic statement; what / who / why / next at a glance
  metrics: two big tiles, "₹ recovered / truck / month" and "< 10% wrong flags"
  pipeline: exists vs new as glowing nodes with thin connectors
  imagery: the 3D truck poster only
  mobile: single column; chapter label above heading
  scroll: native · motion: none
  performance_constraints: one poster image (lazy below the fold where possible); fonts
  seo_intent: title "Why Urja · a concept for Bytebeam"; one h1; not meant to rank
  og_direction: → og/index.html
  assumptions: field quotes pending (A1–A3); byline "Tushar Pathak" to be confirmed
```

## 26. Spatial 3D — the Today hero scene
- **Decision:** user-mandated delighter (2026-09-28). The necessity gate was explicitly overridden, so the purpose is recorded honestly: **brand expression + narrative**. It reconstructs flag 1: RJ14 GB 4521 parked on the left shoulder of NH48 near Behror at 2:14 AM, ignition off, with the fuel tank lit red.
- **Composition:**
  - a procedural Indian heavy truck: chassis, extruded cab with windscreen, visor, grille and mirrors, ribbed cargo body under a tarp, 6 wheels;
  - glowing edge strips (EdgesGeometry + bloom), amber marker lamps, yellow plates;
  - left-hand-traffic lanes with light trails (headlights toward the camera, tail lights away);
  - a dhaba pole lamp as the only warm key light.
- **Camera:** 30° FOV, a high three-quarter view from the front-left. The truck sits left of the glass card. Phones pull the camera back.
- **Interaction:**
  - drag to orbit, mouse and trackpad only, polar 0.72–1.18 rad, azimuth ±0.75 rad;
  - no zoom, no pan;
  - touch: disabled, so the page owns the gesture;
  - planned reset and rotate buttons (Stage 7).
- **Rendering:**
  - three.js r169 via an import map with dynamic import;
  - ACES tone mapping; RoomEnvironment reflections at 0.22;
  - UnrealBloom (0.72 / 0.5 / 0.16);
  - FogExp2;
  - pixel ratio capped at 1.5 (1.25 on touch);
  - renders only while visible; pauses when the tab is hidden.
- **Fallback and loading:** the poster appears immediately and stays if the import fails, the WebGL context fails, or the renderer string reports SwiftShader, llvmpipe or software.
- **Accessibility:** the canvas is `aria-hidden`; the container's `aria-label` describes the scene; every fact is also in text.
- **Heavy-feature line:** about 600 KB of three.js modules from the CDN, loaded after first paint and only on Today. The CPU/GPU cost is justified by the user's explicit request and bounded by the guards above. The page's LCP is the verdict h1, never the scene.
- **Stage 6/7 notes:**
  - Port to React Three Fiber or vanilla three inside the Next.js page, dynamically imported with `ssr: false`.
  - Keep geometry procedural and dispose on route change.
  - Stage 9 checks every input method, reduced motion, forced WebGL failure (poster) and frame pacing on an older laptop and phone.
