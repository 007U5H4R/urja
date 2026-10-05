# Stage 8 gate: independent QA (TSK-15.1, design critique fixes)

**Target:** build/stage7 @ 5406f86, on https://urja-git-build-stage7-tushar-49a6.vercel.app. Vercel status for 5406f86 was `pending` at 04:00 UTC and `success` at 04:05:22 UTC. Every check below ran after that, against 5406f86.
**Method:** Playwright Chromium through `../preview.mjs`, with every request fetched Node-side and TLS verified. Scripts: `qa8/q*.mjs`; shared loader `qa8/lib.mjs`, which retries a page when the proxy returns a 5xx for a chunk. One such transient 502 left `/?view=map` half-hydrated, showing Scene. I re-ran it and it was clean four times out of four. This is environmental, not an app defect.
**Ask budget:** I made 2 real `/api/ask` calls out of the 4 allowed:
- `ok; model=gemini-3.5-flash` on "Which truck earns least per km, and why?";
- `timeout; model=gemini-3.5-flash`, which gave the fallback, on the TC-020 step-5 question.

The 429 state was mocked in the browser.
**Environment:** software GPU, so the hero shows the poster (`.truck3d.fallback`). The only console errors came from vercel.live (ignored).

## Verdict: **FAIL (minor, non-blocking for the demo)**
30 of the 32 DES items marked fixed are fixed on the preview. Two are only partly fixed, and one fix introduced a new moderate axe finding. None is serious or critical, none touches the frozen look, and each is a small CSS or markup change. The gate fails only because the triage lists these items as fixed.

**Items blocking the gate as written:**
1. **DES-20, partly fixed.** The Hindi `/message` header subtitle now fits on one line at ≥ 360 px (header 71 px). The **English** subtitle "Accounts for Sharma Roadlines" still wraps to 2 lines at 375 and 390 px: `small` is 36 px tall and the header is 80 px. The mockup is one line, with a 67 px header, at both widths. The CSS comment in `components/phone/phone.css` accepts English wrapping below about 400 px. That is a scope decision the triage doesn't record. Evidence: `shots/des20-message-en-375.png`.
2. **DES-28, partly fixed.** Text-only 200% (root `font-size: 200%`):
   - **Fixed:** at 1280, all 7 routes, with no horizontal scroll and no clipping. At 375, `/` and `/trips/0926-04` (`/trips` was 413 px before).
   - **Still failing:** at 375, `/why` scrolls sideways (`scrollWidth 409 / clientWidth 375`). "Start the demo" plus the menu button push the menu off-screen (`summary.iconbtn` x 364–408). C10 called out this exact symptom ("menu button pushed off-screen"). Evidence: `shots/des28-why-root200-375-top.png`.
3. **New, caused by the DES-3 fix:** axe reports `landmark-unique` (moderate, best-practice) on `#trucks` at 1440 and 375, on `/` and `/?view=map`.
   - Cause: `section#trucks[aria-labelledby=trucks-h]` and the new `div.tbl-scroll[role=region][aria-labelledby=trucks-h]` are two regions with the same name.
   - The TC-031 e2e check filters for serious and critical only, so it doesn't catch this.
   - A related nit: `.tbl-scroll` is a tab stop at every width, even at 1024–1440, where it doesn't scroll.
   - Fix: give the region its own label, e.g. "Trucks table, scrolls sideways", or drop it from the tab order when it doesn't overflow.

## 1. Per-DES re-check (DES-2 … DES-33)

| DES | Result | Measurement on the preview (5406f86) |
|---|---|---|
| 2 | PASS | `getComputedStyle().backdropFilter` = `blur(14px) saturate(1.15)` on `.floatcard`, `.railbox`, `.scene-tag` (was `none`) |
| 3 | PASS | `.tbl-scroll` (overflow-x:auto, role=region, tabindex 0). scrollWidth = clientWidth at 320 (286/286), 375, 768 (729/729), 800, 860, 1024. The last visible cell's right edge is inside the card everywhere. At root 200% @375 nothing is clipped |
| 4 | PASS | coarse 375: Trip actions 44 px tall; call/message 44×44; Evidence 77×44; seg buttons 44; full screen 44×44; "All 24 trucks" 44; Ask close 44×44; Try again 44; `/brief?state=error` CTAs ≥ 44. Remaining < 44: wordmark 73×30, crumbs 24 px, map markers 26×26 (all ≥ 24 floor). e2e `AXE_TAGS` now includes wcag21/22 and best-practice. axe `target-size`: 0 everywhere |
| 5 | PASS | Shift+Tab from page end at 375 on `/` (16 stops), `/trips/0926-04` (15), `/brief` (9): 0 stops ≥ 50% under the top bar or dock, 0 covered (`elementFromPoint`). `scroll-padding-top: 77px` |
| 6 | PASS | 320 drawer: scrollWidth 319 = clientWidth; "Ask" button at x 247–302, 44 px tall |
| 7 | PASS | 375 Tab order: skip → wordmark → Menu → eyes row 1 → Evidence 1 → … → Evidence 3 → map/scene → switch → full screen → table. It matches the visual stack |
| 8 | PASS | 1440 Map view: Tab to "Show flag 2" selects flag 2 (`aria-pressed` false,true,false). After the 1.4 s fly the marker is at (314,468), inside the map (33–824 × 377–879), in view and not covered. Flag 3 likewise. At 375 and 320, all 3 markers are in view when focused |
| 9 | PASS | Real Gemini answer (`ok; gemini-3.5-flash`) about 3 R3 trips carries `p.muted`: "These are Check flags: the extra use can have other causes, such as a heavier load." |
| 10 | PASS | Knob caption vs rail head, intersection = none: 0927-02 (`knob-under`), 0901-04 (`knob-under`), Today flag 2 (`knob-end`), 0926-04 (mid) |
| 11 | PASS | R3 note "used 364 L · normal 325 L" sits above the dashed line, which no longer crosses the text (`shots/des11-r3-chart-1440.png`) |
| 12 | PASS | Label boxes pairwise: 0 overlaps on fleet, flag 1/2/3 at 1440, 375 and 320. Fleet: "Behror" left of marker 1, "Delhi" right; "Kishangarh pump" left of 2, "Jaipur" below (`shots/des12-fleet-1440.png`) |
| 13 | PASS | No end-city label under the rail box for flags 1–3 at 1440, nor for flag 1 at 375 ("Jaipur" clear, `shots/des12-hero-map-1440-flag1.png`, `des13-hero-map-375-flag1.png`) |
| 14 | PASS | `document.fonts` has an Inter face `U+2190, U+2192` with status loaded; `fonts.check("→")` true |
| 15 | PASS | All 4 KPI footers at 1440: top 1162, height 29 (one line, aligned) |
| 16 | PASS | R5 0831-02: own head "Toll claim against FASTag deductions, plaza by plaza"; table 560 px wide (`shots/des16-toll-1440.png`) |
| 17 | PASS | Cite rows on a model answer: "Jaipur → Ahmedabad, 9 Sep: 38 L · Excess consumption", "Jaipur → Bhiwandi, 17 Sep: 48 L · …", "… 26 Sep: 39 L · …", each distinct |
| 18 | PASS | Mocked 429 (`retryAfterS: 42`), en and hi. Heading: "You've asked a lot in the last minute. Ask again in 40 s." (ticking). One line: "Your question is saved." No AI-blame banner. Try again is disabled ("Try again in 40 s"), 44 px (`shots/des18-429-*.png`) |
| 19 | PASS | `/brief?state=clean` h1 colour `lab(97.1)`, the same as `/?state=clean` (was `lab(72.2)`) |
| 20 | **FAIL (partial)** | hi: 1 line at 375 and 390 (header 71 px), 2 lines at 320 (the mockup also has 2). **en: 2 lines at 375 and 390 (header 80 px; mockup 1 line, 67 px)** |
| 21 | PASS | English menu on `/brief?lang=en` and `/message?lang=en`, and after the in-place toggle: "Morning brief → /brief?lang=en" |
| 22 | PASS (source) | `STATUS_LABEL.confirmed.hi` = "आपने माना"; "पक्का किया" is absent from lib, components and hindi-review.md. hindi-review.md lists STATUS/RULE labels and fallback answers (rows 2, 20) |
| 23 | PASS | `.pv svg`: 20 rects, 5.5 px wide (17 grey, 2 loss, 1 cream; the red count is data-true) |
| 24 | PASS | `/trips/0926-04?state=error` at 375 and 1440: focus on `H1.verdict`, outline `none 0px` |
| 25 | PASS | axe: no `region` on /brief, no `heading-order` on /message (bubble headline is H2), drawer is `DIV[role=dialog]`. Open-drawer axe: none |
| 26 | PASS | Attribution moved top-left. `elementFromPoint` = attribution on the hero (1440, 375, 320) and the trip map (1440, 375, 320). On phones it folds to the "i" after 5 s |
| 27 | PASS | `/why` `.cmp .lacks` display:block with text at 375, 320 and 768 (`shots/des27-why-cmp-375.png`) |
| 28 | **FAIL (partial)** | root 200%: 1280, all 7 routes clean. 375: `/`, trips, brief, message clean; **`/why` 409/375 h-scroll (menu off-screen)** |
| 29 | PASS | `/brief` dock at 375 and 1440: input `:focus-visible` → form outline `solid 2px` `--focus` |
| 30 | PASS | Fallback scene tag vs glass card: gap 20 px at 1021, 1024 and 1030; 41 px at 1100 |
| 31 | PASS | Hindi headline is H2 with `text-wrap: balance`, 2 lines, "नहीं" not alone. Nit: line 2 now starts with the "·" separator ("· ₹11,430 का हिसाब नहीं") |
| 32 | PASS | First Tab on `/`, `/trips/0926-04` and `/why` = "Skip to content" (visible at 12,12, 123×41, ring). Enter moves focus to `MAIN#main`, and the next Tab is the first in-main link. The phone screens /brief and /message have no top bar and no skip link, by design |
| 33 | PASS | 320: `−₹3,420` etc. are `nowrap`, 1 line box. Eyes `.who` scrollWidth = clientWidth (full "Ramesh Kumar · Jaipur → Delhi") |

**Counts:** 30 PASS, 2 partial FAIL (DES-20, DES-28). DES-34…38 are parked and weren't re-judged. DES-38 is still visible: the 1440 glass-card route line is 39 px (2 lines).

## 2. Design.md §17 Stage 8 items (after fixes)

| Check | `/` | `/?view=map` | `/trips/0926-04` | `/brief` | `/brief?lang=en` | `/message` | `/why` |
|---|---|---|---|---|---|---|---|
| 320 px reflow (no h-scroll, nothing clipped) | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 200% page zoom @1280 (640 css px) | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 200% root font @1280 | PASS¹ | PASS¹ | PASS | PASS | PASS | PASS | PASS |
| 200% root font @375 | PASS | PASS | PASS | PASS | PASS | PASS | **FAIL** (409/375) |
| 200% page zoom @375 (188 css px; beyond WCAG 1.4.10's 320) | info: h-scroll 212 | info: 212 | info: 248 | info: 254 | info: 255 | info: 202 | info: 286 |

¹ The eyes `.who` ("driver · route") is ellipsised at 200% text; the same facts are on the trip page. The only clip the script flagged at 320 is map content past the map edge (MapLibre labels) and the `/brief` earned panel's decorative overflow. Neither hides text (`shots/s17-320-brief-top.png`).
**WCAG 1.4.4** is met through page zoom. The one text-only failure is DES-28 on `/why`.

**Keyboard-only TC-020 (1440, Tab, Enter and Ctrl+K only):**

| Step | Result | Evidence |
|---|---|---|
| 1 /message → "पूरा हिसाब देखें" | PASS | 4 stops, ring 2 px `--focus`; Enter → /brief |
| 2 /brief → item 1 | PASS | 4 stops; Enter → /trips/0926-04 |
| 3 trip → Today pill | PASS | 4 stops (skip, wordmark, Ask, Today); Enter → / |
| 4 Scene → Map | PASS | 11 stops; Enter: Map `aria-pressed=true`, focus kept |
| 5 Ctrl+K and ask | PASS | Focus to `#askIn`. The answer (Gemini timed out, so fallback) has ₹1,86,400 and ₹11,430 and cites 0926-04, 0927-02, 0926-11. Focus stays in the drawer over 12 Tabs; Esc returns focus to "Map" |
| 6 Why Urja pill | PASS | 5 stops from the wordmark; /why loads. No app console errors on the whole path |

No stop on the path lacked a ring, was off-screen or was covered.

## 3. Regressions vs the frozen mockups
Side-by-side images (`shots/sbs-*`; app left, mockup right) at 1440 and 375 for Today, Trip, Brief, Message and Why, plus Today at 1024.
- **Hero composition at 1440 and 1024:** unchanged.
  - The 7fr/5fr grid has the hero left and the eyes right on desktop (DES-7 uses grid placement, so it looks the same).
  - The glass card is top-right with the lamp "Open the evidence" CTA, and the rail box is at the bottom.
  - The fallback scene tag is top-left and now clears the card by 20 px at 1024.
  - The CTA hierarchy is unchanged everywhere: lamp primary, line secondary on Trip and Why.
- **Today grid at 1440 and 1024:** unchanged.
  - KPI 4-up at 1440 and 2×2 at 1024, with footers now aligned.
  - The table columns are the same.
  - The page is 13 px shorter at 1440 because of the realigned KPI footer.
- **Visible differences that are intended DES fixes:**
  - the map attribution is top-left (DES-26);
  - the R5 toll panel is narrower (DES-16);
  - the `/why` "lacks" lines on phones (DES-27; +172 px at 375);
  - the 20-bar preview (DES-23);
  - the skip link, on focus only.
- **Not intended, minor:**
  - **Phone hero map at load:** the expanded attribution, top-left, covers the "Delhi" label for its first 5 s (`shots/des13-hero-map-375-flag1.png`). After it folds, Delhi is clear.
  - **Phone hero map, flag 3 view at 375 and 320:** markers 1 and 2 overlap each other when the camera frames the whole trip. This is a marker-to-marker overlap, not a label overlap.
  - **`/message` at 375:** the balanced Hindi headline starts line 2 with "·" (DES-31 side effect). The mockup fits on one line.
  - The `landmark-unique` axe item and the `.tbl-scroll` tab stop on desktop (see the verdict).
- **Everything else matches**, with type rendering differences only:
  - the Trip 1440 and 375 layout and order;
  - Brief (hi) 375;
  - Message 375;
  - the Why 1440 hero and chapters.

## 4. Wording
- I swept the visible text, `aria-label`/`title`/`alt`/`placeholder` and `document.title` on 20 routes: Today ×3 views, 6 trips, brief hi/en/only=high, message hi/en, why, 4 states and og-card. "theft / stolen / steal / thief / चोरी" appear **0** times, and "undefined"/"NaN" 0 times.
- Both live Ask answers were clean.
- Low confidence still says **"Check"**: on Today, on trip 0926-11, on brief en/hi (जाँचें), on message en/hi, and in the Ask caveat and fallback ("0926-11 … Check").

## 5. axe (wcag2a/aa, wcag21a/aa, wcag22aa, best-practice)
At 1440 and 375, `/trips/0926-04`, `/brief`, `/brief?lang=en`, `/brief?only=high`, `/message`, `/message?lang=en`, `/why`, `/brief?state=clean`, `/trips/0926-04?state=error` and the open drawer show no violations. `/` and `/?view=map` show **`landmark-unique` (moderate) on `#trucks`** (new). Raw results: `qa8/axe.json`.

## Screenshot index (all under `qa8/shots/`)
- **Gate report pairs (app | mockup):**
  - `sbs-today-1440-0.png`, `sbs-today-1440-1.png`;
  - `sbs-today-1024-0.png`, `sbs-today-1024-1.png`;
  - `sbs-today-375-0..2.png`;
  - `sbs-trip-1440-0..1.png`, `sbs-trip-375-0..2.png`;
  - `sbs-brief-375-0.png`, `sbs-brief-1440-0..1.png`;
  - `sbs-message-375-0.png`, `sbs-message-1440-0.png`;
  - `sbs-why-1440-0..5.png`, `sbs-why-375-0..4.png`.

  The raw full pages are `reg-app-*.png` and `reg-mock-*.png`.
- **FAIL evidence:**
  - `des20-message-en-375.png`;
  - `des28-why-root200-375-top.png`;
  - `s17-root200-375-_why.png`.
- **DES evidence:**
  - `des3-table-320.png`, `des6-drawer-320.png`;
  - `des8-marker2-focus-1440.png`, `des8-marker2-375.png`, `des8-marker2-320.png`;
  - `des9-17-ask-1440.png`;
  - `des10-rail-0927-02.png`, `des10-rail-today-flag3.png`;
  - `des11-r3-chart-1440.png`;
  - `des12-fleet-1440.png`, `des12-hero-map-1440-flag{1,2,3}.png`;
  - `des13-hero-map-375-flag1.png`;
  - `des16-toll-1440.png`;
  - `des18-429-en-375.png`, `des18-429-hi-375.png`;
  - `des19-brief-clean-375.png`;
  - `des20-message-375.png`, `des20-message-320.png`;
  - `des23-pv-375.png`, `des24-trip-error-375.png`;
  - `des26-hero-375-load.png`, `des26-hero-320-load.png`, `des26-trip-map-375.png`;
  - `des27-why-cmp-375.png`, `des28-today-root200-1280-top.png`;
  - `des29-dock-focus-375.png`, `des30-hero-1024.png`;
  - `des32-skip-1440.png`, `des33-trip-320.png`.
- **§17 sweeps:** `s17-{320,zoom200-1280,zoom200-375,root200-1280,root200-375}-<route>.png`.
- **Keyboard path:** `kb-step4-map-1440.png`, `kb-step5-ask-1440.png`.
