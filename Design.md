# Design Specification — Urja

**Status:** Draft for approval (Stage 4) · **Ticket:** TASK-2 · **Inputs:** `Solution-PRD.md`, `Discovery-PRD.md`, `decisions.md`
**Approved mockup (pending):** `.design/exploration/final/` · gallery `.design/exploration/index.html` · OG `.design/exploration/og/`
**Surface classification:** Core (Today, Trip, Brief, Message, Ask) + one Web page (Why Urja, public pitch). Not a Product Journey: no signup or onboarding exists.

---

## 1. Design Intent
- **Direction — "The Munshi's Ledger".** Evidence-led and rupee-first. Every screen opens with a verdict written as one sentence with the number in it, and puts the proof underneath. Calm authority, like a well-kept khata, not an alarm panel. Desktop is a warm-dark "night ledger"; the owner's phone is a warm-light "morning paper".
- **Anti-direction.** Generic AI SaaS (purple/blue gradients, glass, glow, orbs, sparkles). KPI-tile dashboards (the Power BI / Excel examples in `references/`). Grafana-style panel walls of gauges with no verdict. Siren-red "THEFT DETECTED" alert tone. Gamified driver leaderboards that shame people.
- **Signature details (earned, product-specific):** the **Indian commercial yellow number plate** as the truck identifier everywhere; **Indian digit grouping** (₹1,86,400); the **munshi's ledger** receipt beside the day's headline; **Hindi-first** on the owner's phone.
- **Generative assets:** none. Real product evidence (route trails, fuel traces, plates, ledgers) beats illustration for this user; nothing here needs Higgsfield/Recraft.

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
2. **Desk review (desktop):** Today → "Needs your eyes" row → Trip evidence → resolve / ask driver.
3. **Question:** ⌘K or the phone dock → Ask Urja (Hindi or English) → answer with cited trips → open a trip.
4. **Month review:** Today → September report cards → trucks ranked by ₹/km → a truck (Truck Report Card is the first cut if time runs short).
5. **Interview demo:** Message → Brief → Trip → Today → Ask (live) → Why Urja. Five minutes.

## 4. Emotional Journey
| Step | Intended | Risk to prevent | Design response |
|---|---|---|---|
| Message | Oriented, in control | "Another noisy alert" | One headline, 3 lines, "the other 14 are fine" |
| Brief | Clear-headed | Panic, anger at drivers | Neutral words ("doesn't add up"), confidence on every line |
| Trip evidence | Convinced by facts | Suspicion of the tool | Evidence with sources; "Why high"; clean stops marked "checked, nothing to see" |
| Ask driver | Fair, confident | Guilt, confrontation | Pre-written neutral message; "nothing is deducted until you decide" |
| Ask Urja | Curious, capable | Being misled by AI | Citations, scope, model, "Urja can be wrong" |
| **Peak** | "Oh — 2:14 AM, parked, 38 litres." | — | The fuel chart's drop lines up with the map pin and the timeline |
| **End** | Settled | Dangling worry | Clean-day state: "All 17 trips add up"; resolved flags leave the list |

## 5. Information Architecture
- **Desktop:** Today (home) · Trucks · Trips (→ Trip evidence) · Why Urja. Ask Urja is global (button + ⌘K), never a page.
- **Phone:** the Message is the entry and the Brief is home. Trip evidence is one tap from the brief. A "Menu" disclosure reaches Today, Trucks, Trips and Why Urja. Ask lives in a bottom dock.
- **Objects:** Fleet → Truck (plate) → Trip → Flag (rule, confidence, evidence, driver's side) · Ledger (per trip, per day).

## 6. Screen / Flow Architecture
| Screen | File | States |
|---|---|---|
| 7 AM message | `final/message.html` | working; (clean-day variant = brief clean state) |
| Morning brief (phone, light) | `final/brief.html` | loading · empty · clean · error · working |
| Today (desktop) | `final/index.html` | loading · empty · clean · data-late error · working |
| Trip evidence | `final/trip.html` | loading · error · working (a trip with no flags shows the clean ledger) |
| Ask Urja drawer / dock | in `index.html`, `brief.html` | idle (suggested questions) · answering · answer · fallback · error |
| Screen states | `final/states.html` | reference for all of the above |
| Why Urja (web) | `final/why.html` | static |
| OG image | `og/index.html` | — |

## 7. Attention Architecture (one focal point, then scan order)
- **Message:** headline (earned · doesn't add up) → 3 lines → "Open today's brief".
- **Brief:** ₹ earned → red "doesn't add up" → the 3 trips (plate → ₹ → sentence → confidence → driver status).
- **Today:** hero sentence → ledger → "Needs your eyes" rows → truck ranking → map → report cards.
- **Trip:** verdict (₹ profit, ₹ below normal) → flag card → map → fuel chart → timeline → trip ledger.
- **Ask:** the answer's first sentence (name + plate + ₹) → cited trips → caveat → provenance.

## 8. Cognitive Load
- **Intrinsic (kept):** money reconciliation, which the product exists to do.
- **Extraneous (removed):** charts on the home screen; engineering terms ("CAN", "geofence") moved to small source labels inside evidence; gauge widgets; per-signal panels.
- **Deferred:** monthly analytics (report cards at the bottom), full truck list ("All 24 trucks"), per-truck page.
- **Chunking:** at most 3 flags in the brief and message; the rest are summarised as "the other N trips add up".

## 9. Behavioral & Psychological Rationale (all pass the ethical gate)
| Principle | Use | Ethical check |
|---|---|---|
| Von Restorff | One amber primary action per view ("Ask Ramesh on WhatsApp", "Ask Urja") | The primary action is the fair one (ask), never "deduct" |
| Choice overload | 3 flags max per brief | Nothing hidden: "the other 14 add up" is stated |
| Serial position | Flags ordered by confidence, then ₹ | Surest first, so the owner acts on the strongest evidence |
| Recognition over recall | Yellow plates mirror the real plate on the truck | — |
| Tesler's law | The product absorbs reconciliation; the owner sees the verdict | — |
| Peak-End | Peak = the aligned evidence; end = clean day / resolved flag | No upsell or dead end |
| Zeigarnik | "Waiting for you: 3 flags" | Count is true; no nagging, no streaks |
| Labor illusion | Loading shows real progress ("11 of 17 done") | Only real work is shown; no fake "AI thinking" |

**Ethical Behavioral Design Gate:** [x] serves the owner's goal · [x] truthful (no fake urgency, scarcity or metrics) · [x] every flag can be dismissed, explained or reversed · [x] no fear/shame exploitation (driver-neutral wording) · [x] the easy path (ask the driver) is the honest path.

## 10. Production Pattern Research (Mobbin, 2026-09-28)
- **Flighty — Passport cards / Delay Report:** one colour per card, one huge number, a qualifier line, raw count next to % → the September report cards.
- **Flighty — flight detail:** verdict banner first, planned vs actual with lateness chips → trip header ("₹3,420 below this route's normal").
- **Strava — activity detail:** achievements pinned on the route line, scrub-able charts with a dashed reference → map event pins; dashed "without the drop" line.
- **Mercury — transactions + drawer:** net change above a dense table, rows opening a notes/receipts drawer → ledger rows; the flag card as evidence container.
- **CRED — spends summary:** Indian-native ₹ formatting, provenance footnote on AI highlights → ₹ grouping; Ask provenance line.
- **Perplexity / Gemini Notebook — source chips:** each claim ends in a chip; scope shown → Ask citations name the **record** ("Trip 0926-11"), not a document; scope "212 trips across 24 trucks".
- **WhatsApp — structured bubbles:** bold title, compact lines, footer action → the 7 AM message.
- **Gap:** Mobbin has no Samsara/Motive/Uber Freight screens; fleet patterns come from first principles plus Felt's status-dot map.
- **Adopted synthesis:** verdict first, proof underneath; one planned-vs-actual grammar; one card = one colour = one number; cite records; neutral two-sided flags.

## 11. Anti-References
1. **The Power BI / Excel fleet dashboards in `references/`**: KPI tiles, 3D pie, gradients, "Total Revenue" everywhere. They show numbers but never answer "what should I do?"
2. **The Grafana OBD2 dashboard in `references/`**: a wall of gauges and signals, built for engineers, not owners.
3. **Siren "theft detected" alerts**: accusatory red UI that turns a sensor reading into a verdict about a person.

## 12. Design System (created; no existing system in this repo)
**Colour (OKLCH, semantic tokens):**
| Token | Dark (desktop) | Light (phone) | Job |
|---|---|---|---|
| `--bg` | 0.155 0.008 70 | 0.985 0.006 85 | page |
| `--surface-1/2` | 0.192 / 0.232 | 1.0 / 0.960 | containers / inputs |
| `--line`, `--line-soft` | 0.300 / 0.245 | 0.880 / 0.925 | hairlines |
| `--fg`, `--fg-muted`, `--fg-subtle` | 0.955 / 0.760 / 0.630 | 0.200 / 0.420 / 0.520 | text ramp |
| `--brand` (amber) | 0.800 0.155 72 | 0.780 0.160 70 | brand + primary action **only** |
| `--plate` | 0.870 0.165 95 | same | number plate only |
| `--loss` | 0.700 0.185 27 | 0.530 0.190 27 | money leaked **only** |
| `--gain` | 0.780 0.145 155 | 0.500 0.130 155 | profit **only** |

Warm-tinted neutrals (hue 70–85) in both themes, so the light background is the same family as the dark one, not a stand-alone cream.

**Measured contrast (WCAG 2.2):** every text pair passes AA. Lowest: dark `fg-subtle` on `surface-2` 4.80:1; light `fg-subtle` on `surface-2` 4.91:1. Buttons: 9.49:1 (dark) and 8.82:1 (light). Plate 12.93:1. (Script: `Dev/.scratch/urja-shots/contrast.mjs`.)

**Typography:** Anek Latin + Anek Devanagari (Ek Type; one design family for both scripts, variable width and weight). Tabular figures everywhere. Scale: hero `clamp(2.1rem, 1.3rem+2.6vw, 3.6rem)` · report number `clamp(2.6rem, 1.6rem+3.2vw, 4.4rem)` · h2 1.25rem · body 1rem · sm 0.875rem · xs 0.78rem (floor ≈ 12.5px). Display line-height 0.98–1.2; body 1.5. Headings `text-wrap: balance`.

**Spacing:** 4px base — 4 · 8 · 12 · 16 · 20 · 24 · 32 · 44 · 56 · 72. **Radius:** 12 (containers) · 8 (controls) · 5 (plates, chips) · pill only for the language toggle and the phone dock. **Elevation:** only the Ask drawer and the mobile menu. **Icons:** almost none; text carries meaning. Used: the gauge wordmark, the chevron, the check. If more are needed, one family (Lucide, 1.5 stroke).

**Surfaces allow-list:** flat + hairline border everywhere · subtle top tint on report cards and the flag card (one theme colour each) · no glass, no glow, no shadows except overlays.

## 13. Component Architecture (need → info → interaction → component)
| Need | Info model | Interaction | Component |
|---|---|---|---|
| "Which truck?" | plate string | none | **Plate** |
| "How much?" | ₹ amount, sign, meaning | none | **Money** (en-IN grouping; `−` for costs; loss/gain colour + words) |
| "How sure?" | High / Likely / Check (पक्का / शायद / जाँचें) | none | **Confidence meter** (3 bars + word) |
| "What needs me?" | truck, rule, where/when, ₹, confidence, driver status | row → trip | **Flag row** |
| "Why should I believe it?" | rule, title, ₹, evidence + source, why-confidence, driver's side | ask driver · mark explained | **Flag card** |
| "Does the day add up?" | freight, diesel, tolls, other, profit | none | **Ledger** (rows, indented sub-row, total) |
| "What happened?" | time-ordered events with values | none | **Timeline** |
| "Where did fuel go?" | fuel litres over time, flagged window, expected line, moving/stopped strip | none (production: scrub synced with map) | **Fuel chart** (desktop + simplified phone variant) |
| "Where are they / where did it go?" | truck positions; planned vs actual route; event pins | pan/zoom | **Fleet map**, **Trip map** |
| "How's the month?" | one number + 3 facts | "see all" | **Report card** |
| "Ask anything" | question, answer, cited records, scope, model, time, caveat | type, suggested chips, cite → trip | **Ask drawer / dock** |
| Language | hi / en | toggle | **Language toggle** (sets `lang`) |

## 14. Interaction Design
- **Fitts:** primary buttons 38px desktop, 44–48px on phone; the whole flag row and brief item are the tap target.
- **Hick:** 3 flags, 3 suggested questions, 2 driver-side actions.
- **Jakob:** the message follows WhatsApp bubble conventions; tables and ledgers follow accounting conventions (right-aligned figures, total rule).
- **Gestalt:** proximity groups ledger rows; common region only where containment is real (flag card, report card, drawer); similarity: every truck is a yellow plate.
- **Tesler:** Urja computes; the owner decides.
- **Keyboard:** ⌘K opens Ask, Esc closes it, focus goes to the input on open and returns to the trigger on close.

## 15. Motion Design
| Motion | Spec | Purpose |
|---|---|---|
| Ask drawer | translateX 100%→0, 240 ms, cubic-bezier(.2,.8,.2,1) | spatial: it comes from, and returns to, the right edge |
| Scrim | opacity 0→1, 180 ms | figure-ground while the drawer is open |
| Hover | background change, instant | affordance |
| Everything else | none | — |

**Reduced motion:** all transitions and animations off. **Scroll strategy:** native on every surface; no scroll-linked effects, no reveals, no smooth-scroll library. The map never auto-flies.

## 16. Responsive Behavior
- **Phone task model (≤760px):** the owner's home is the **Brief** (light), not Today. Trip evidence reorders **flag card first**, then map (300px), then a **simplified fuel chart** (larger type, 3 time labels), timeline, ledger. Today stacks: hero → ledger → flags (plate + ₹ on one line, sentence, confidence) → truck table (#, plate, ₹/km, unaccounted) → map → report cards. Navigation via the "Menu" disclosure; Ask via the header button (full-screen drawer) or the brief's bottom dock. Shortcut hints hidden on touch.
- **Tablet (761–1100px):** single column; full truck table; report cards 2 + 1; trip flag card above the map.
- **Desktop (>1100px):** hero with ledger beside it; flags table with driver column; split truck table / map; 3 report cards; trip map + flag card side by side.
- **Verified (rendered, puppeteer + Chrome, true mobile emulation):** no horizontal scroll at 375 / 768 / 1440 on every page; menu opens on tap. **320px reflow and 200% text** are specified but not yet verified; they go to Stage 8.

## 17. Accessibility (WCAG 2.2 AA)
- [x] Contrast measured, all pairs pass (§12).
- [x] Colour independence: confidence = bars + word; money = sign + words + colour; map legend = shape + label; the state strip is explained in text.
- [x] Semantics: one h1 per page, landmarks, real tables with headers, `role="img"` + descriptive `aria-label` on map and chart, `aria-live` on the brief's numbers, `lang` switches to `hi`/`en` with the toggle.
- [x] Chart and map information is also in the timeline and evidence list (text equivalents).
- [x] Targets: ≥ 44px for primary phone actions; ≥ 24px floor elsewhere.
- [x] Reduced motion defined (§15).
- [ ] **Focus trap inside the Ask drawer**: not in the mockup; required in production (Stage 7), with `inert` on the page behind.
- [ ] **Reflow at 320px, text at 200%, keyboard-only pass on the rendered final**: Stage 8 verification.
- N/A: drag interactions (none), media (no video or audio).

## 18. State Design (every data-backed view)
| View | Loading | Empty | Error | Working |
|---|---|---|---|---|
| Today / Brief | skeleton rows + real progress "Checking 17 trips… 11 of 17 done" | "No trips finished yesterday" + where trucks are + next brief time | **data late** (partial): "6 trucks haven't sent data since 2 AM… nothing is lost… the other 11 are ready" + show ready / retry | flags + clean line; **clean day** is its own success state |
| Trip | skeleton of head + card | n/a (a trip always has a ledger) | "Couldn't load this trip" + retry; the brief summary stays visible | as mocked |
| Ask Urja | truthful single status "Asking Gemini…" (no fake steps) | suggested questions | **fallback:** deterministic standard report for recognised questions (e.g. diesel last week), with citations; else "couldn't answer, your question is saved" + retry | answer + cites + provenance |
| Maps | basemap loading = container with legend | — | tiles fail → the container says "Map unavailable; every event is in the timeline" | as mocked |

## 19. Trust & Transparency (incl. AI epistemic UX)
- Every flag shows its **rule**, its **evidence with the source** of each line (fuel sensor, GPS · ignition, geofence, fleet history) and **why** the confidence is what it is.
- **Wording rules:** "unaccounted" / "doesn't add up", never "theft"; low confidence says "Check".
- **Driver's side** on every flag; nothing is deducted automatically; the pre-written message to the driver is shown before it's sent.
- Clean stops are affirmed ("fuel steady, checked, nothing to see"), which shows the system isn't trigger-happy.
- **Ask Urja** cites records, states its scope (trips, trucks, dates), the model and the response time, and says it can be wrong. It answers only from fleet data and says "I don't have that data" otherwise.
- **Honest prototype:** the Why Urja page says what is simulated and what is real, and that it isn't a Bytebeam product.

## 20. Error & Recovery Strategy
Blame the system, name the fix, preserve work. Every error says what happened, what to do next, and whether anything was lost ("the devices store data and send it when they reconnect"; "your question is saved"). Recovery is always a visible button (Retry, Show the ready trips), never a vanishing toast. Money is never cute: no jokes near ₹.

## 21. Interaction Cost
- **Morning check:** notification → "Open today's brief" (1) → trip (2) → "Ask Ramesh on WhatsApp" (3). Three taps from 7 AM to action.
- **Desk review:** flag row (1) → ask driver (2).
- **Ask:** ⌘K (1) → type → Enter (2); suggested chip = 1 tap.
- Cut: no login in the demo, no filters before value, no drill-down to see the ₹ amount (it's on the row).

## 22. UX Risks & Assumptions
- **ASSUMPTION A1–A3** (Discovery-PRD): leakage is a top pain; owners act on a morning WhatsApp; accusing drivers is the real risk. Field conversations by 2026-10-01.
- **Hindi copy** needs a native-speaker review (tone of "हिसाब नहीं मिल रहा", "पक्का / शायद / जाँचें").
- **WhatsApp Business API**: the real message must fit an approved template (≤ 3 quick-reply buttons, limited formatting). The mockup follows those limits but hasn't been checked against Meta's template rules.
- **Carto basemaps**: free tier requires attribution and has usage limits; fine for a demo, revisit for production.
- **Fuel-sensor realism**: real CAN fuel readings are noisy; the ±2 L noise band in the copy is illustrative until real data is seen.

## 23. Validation Plan
1. **Field test (best):** show the 7 AM message screenshot to the 2–3 transporters in the field conversations and ask "what would you do next?" Doubles as discovery.
2. **5-second test** with 2 people on Today and the Brief: "what is this page telling you?"
3. **Native Hindi read-through** of the brief and message.
4. **Stage 8** design critique of the built app against this file and `final/`; **Stage 9** runs responsive, state and a11y cases; Ask Urja evaluated on 10 + 3 questions (Solution-PRD acceptance #3).

## 24. Design QA Checklist
**Nielsen lens:** status visible (reconciled at 6:40 AM, progress while loading) · real-world language (hisaab, bhatta, plates) · user control (dismiss/explain/reverse flags) · consistency (one ledger grammar) · error prevention (nothing auto-deducted) · recognition over recall · minimalist (3 flags) · recovery (every error has an action) · help (Why high, Why Urja).

**Anti-AI-Slop Review Gate:**
- Structure: [x] grayscale test passes (verdict sentences, ledgers and tables carry hierarchy without colour) · [x] primary goal obvious · [x] hierarchy clear · [x] task model coherent
- Specificity: [x] fails the 20-SaaS swap test (plates, ₹ lakh grouping, Hindi, munshi ledger, NH48 trip evidence can't belong to another product) · [x] domain terminology · [x] direction from domain/user/task · [x] anti-direction explicit (§1)
- Components: [x] no card-everything (cards only for flag, report, drawer, states) · [x] each component has an interaction reason · [x] badges semantic (plate, confidence) · [x] icons minimal and meaningful
- Visual: [x] gradients justified (only a faint top tint marking the one theme colour of a report/flag card) · [x] no glass · [x] radius intentional (12/8/5) · [x] shadows only on overlays · [x] typography carries identity (Anek, both scripts) · [x] colour has semantic jobs (§12)
- Copy: [x] no generic AI marketing language · [x] CTAs name the action ("Ask Ramesh on WhatsApp", "Show the 11 ready trips") · [x] metrics are real **within the simulated dataset** and consistent across screens · [x] labels are real domain objects
- AI: [x] processing states truthful · [x] sources/provenance shown · [x] uncertainty shown · [x] consequential action (message to driver) previewed before sending
- Responsive: [x] phone has its own task model · [x] tablet defined · [x] desktop defined
- Motion: [x] every animation has a purpose · [x] reduced motion defined
- Scroll: [x] native everywhere; no reveals, parallax, snap, scroll-jacking, pinned sections or nested-scroll traps
- Web (Why Urja): [x] hero answers what/who/why/next · [x] section order follows the argument (heard → owner → gap → build → metric → plan → honesty) · [x] one primary CTA ("See the 7 AM brief") · [x] no fake proof: field quotes are marked placeholders · [x] detector run (below)
- Catalog items present with justification: **near-black + one accent** → amber is the brand's "energy" (Urja) and the only action colour, and the dark desktop exists because route trails and fuel traces read best on dark · **warm off-white on the phone** → same warm-neutral family as the dark theme, chroma 0.006 · **numbered sections on Why Urja** → a real reading sequence.

**Detector (`npx impeccable detect .design/exploration`):** 23 → 8 findings after fixes (text raised to ≥ 12px, shimmer removed, side-tab quote restyled, OG padding, em-dashes trimmed, "—" zero cells → "₹0"). Remaining, justified:
- `undersized-ui-text` "litres / per km / flagged / profit": false positive; the detector can't resolve `clamp()` inside a custom property. Rendered sizes measured at 17.5–29.6px (report units) and 14.4–21.6px ("profit").
- `cream-palette` (brief, message): justified above.
- `tight-leading` (Why hero/h2, OG headline): display type at 28–92px, set at 0.98–1.25 per `visual-system.md §5`; body text is 1.45–1.5.

**Accessibility checklist:** see §17 (two items deferred to Stage 7/8 with reasons).

**web-deliverables design gates:** [x] responsive strategy decided and rendered at 375/768/1440 · [x] four screen states designed (`states.html`) · [x] OG image mockup (below).

**OG image (`og/index.html`):** archetype = typography-first + one product fragment. Message: "Where did the diesel go?" plus one real-looking flag (plate, 38 L, fuel-drop trace, ₹3,420) and "An AI munshi for Indian fleet owners · a concept for Bytebeam". Thumbnail test at 30%: headline, plate and ₹ still readable.
OG anti-slop gate: [x] not a homepage screenshot · [x] not a mini-webpage · [x] no purple gradient · [x] no orb · [x] no tiny UI (one fragment, enlarged) · [x] no fake business metrics (the ₹3,420 is a labelled sample of product output from the fictional fleet) · [x] no badges · [x] no "AI-powered" headline · [x] no 3-card layout · [x] one focal point · [x] recognisable at thumbnail · [x] understood in ~2 s · [x] Urja's own visual language · [x] strong without decoration.

## 25. Web Experience — Why Urja only
```yaml
web_experience:
  audience: Bytebeam interviewer and anyone they forward the link to; problem-aware, product-literate, skeptical of AI hype; desktop first, phone second
  user_need: "I need to judge in 3 minutes whether this candidate finds real problems and thinks like an owner of the outcome"
  business_goal: interviewer remembers the problem, the user, the metric + guardrail, and the Bytebeam fit
  conversion: primary "See the 7 AM brief" · secondary "Open a flagged trip"
  narrative: heard → owner → market gap → built on Bytebeam → metric/guardrail → first 90 days → what's real
  visual_direction: The Munshi's Ledger, editorial variant (reading width 68ch, numbered chapters)
  anti_direction: SaaS landing template (centered hero + 3 feature cards + logo wall)
  layout: max 1080px; 180px chapter rail + 68ch body; single column ≤860px
  typography: → §12
  color: → §12
  surfaces: flat; metric boxes are the only containers; "new" pipeline steps tinted amber
  hero: typographic statement, no image; what (Urja), who (fleet owners), why (they learn too late), next (see the brief)
  navigation: same top bar as the app + "Start the demo"
  imagery: none; product evidence lives one click away
  mobile: single column; chapter label above heading; comparison table drops the third column
  scroll: → §15 (native)
  motion: none
  accessibility: → §17
  performance_constraints: text only; fonts are the only weight
  seo_intent: title "Why Urja · a concept for Bytebeam"; one h1; not meant to rank
  og_direction: → og/index.html
  analytics_intent: none for the interview build
  assumptions: field quotes pending (A1–A3)
```
