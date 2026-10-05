# Stage 9 QA, TSK-15.2: TC-055 and TC-020 on the preview

**Target:** https://urja-git-build-stage7-tushar-49a6.vercel.app. The build/stage7 head is `b2b5d69` (its code equals 55c8e1a), and the Vercel status for b2b5d69 is `success` (checked 2026-10-05, live on the first poll).
**Browser:** Playwright Chromium 1194, run through the agent proxy (`--proxy-server=$HTTPS_PROXY`). **TLS stays verified.** The NSS store `/root/.pki/nssdb` was empty, so I installed `libnss3-tools` with apt and added `/root/.ccr/agent-proxy-ca.crt` as `ccr-agent-proxy` with trust `C,,`. That is the same method as EXE25. A sandbox-only change; nothing was written to the repo.
**/api/ask:** the real route was never called. `page.route("**/api/ask**")` returned the EVAL-005 baseline answer (from `ask-baseline-v1-1395e7c.json`) as an `AskResponse` with mode `model`, 3 cites and a 3.1 s delay (that case's serverMs was 3125).

## Verdicts
| Item | Verdict |
|---|---|
| TC-055: Lighthouse `/` LCP ≤ 2.5 s, CLS ≤ 0.1 | **PASS**: median LCP 1.80 s, CLS 0.003 |
| TC-055: Lighthouse `/why` LCP ≤ 2.5 s | **PASS**: median LCP 1.62 s (CLS 0.078) |
| TC-055: `/` first-load JS ≤ 200 KB gzip | **PASS**: 191,171 B gzip (186.7 KiB), 10 initial chunks |
| TC-055: no `three` or `maplibre` in the initial scripts | **PASS**: no initial chunk contains `maplibregl`, `WebGLRenderer` or `THREE.` |
| TC-020 at 375 (mobile, touch) | **PASS** |
| TC-020 at 1440 | **PASS** |
| TC-020 at 375 with Fast 3G | **PASS**: usable at every step; the slowest is a cold load of the trip page, 6.7 s |

## 1. TC-055: performance budget
Lighthouse 12.8.2 (`npx lighthouse@12.8.2`), form factor mobile, simulated throttling, performance category only. Chrome flags: `--headless=new --no-sandbox --proxy-server=$HTTPS_PROXY`. Raw JSON is in `lh/`.

| Run | LCP s | CLS | FCP s | TBT ms | Score |
|---|---|---|---|---|---|
| `/` 1 | 1.80 | 0.003 | 1.20 | 82 | 0.99 |
| `/` 2 | 1.76 | 0.003 | 1.16 | 53 | 1.00 |
| `/` 3 | 1.83 | 0.003 | 1.17 | 105 | 0.99 |
| `/` 4 | 1.76 | 0.003 | 1.16 | 55 | 1.00 |
| `/` 5 | 4.35 | 0.000 | 2.48 | 142 | 0.77 |
| **`/` median of 5** | **1.80** | **0.003** | 1.17 | 82 | |
| `/why` 1 | 1.32 | 0.078 | 1.32 | 44 | 0.99 |
| `/why` 2 | 2.80 | 0.000 | 1.28 | 36 | 0.96 |
| `/why` 3 | 1.62 | 0.078 | 1.32 | 61 | 0.98 |
| **`/why` median of 3** | **1.62** | **0.078** | 1.32 | 44 | |

- **Outliers are kept.** `/` run 5 (4.35 s, with FCP also doubled) and `/why` run 2 (2.80 s) are slow proxy hops, the same pattern as the roughly 4.5 s outliers recorded in EXE25. Both medians are well under 2.5 s and match EXE25 (1.83 s and 1.52 s).
- **`/why` CLS of 0.078** in 2 of 3 runs is under 0.1, but it is close. TC-055 sets no CLS budget for `/why`, so this is a watch item only.
- **First-load JS of `/`:**
  - Method: every `<script src>` in the server HTML of `/`, each fetched with `Accept-Encoding: gzip`.
  - Result: 10 chunks, 191,171 B gzip, 608,845 B raw. Budget: 200 KB.
  - The largest chunks are `1mz6upfzen6w_.js` (72.4 KB) and `3-q4a0z9od6gv.js` (44.2 KB).
  - Cross-check: Lighthouse saw 14 scripts during load (including lazy ones) at 184,503 B transfer, which is brotli.

## 2. TC-020: demo path (script `demo.mjs`, JSON in `tc020-<tag>.json`)
**Path:** `/message` → "पूरा हिसाब देखें" → `/brief` item 1 → `/trips/0926-04` → Today through the nav (the menu at 375, the pill at 1440) → Scene→Map → flag 2 → Ask (the menu's "Ask Urja" at 375, Ctrl+K at 1440) → cite → `/trips/0926-04` → Why Urja.

**Numbers on screen (identical at all three tags):**
- `/message`, `/brief` and `/`: ₹1,86,400, ₹11,430, ₹3,420, 38 L, ₹4,500 and ₹3,510.
- `/` hero: "Your trucks earned ₹1,86,400 yesterday. ₹11,430 of it doesn't add up, across 3 trips."
- `/message`: "17 ट्रिप पूरी हुईं। इन 3 को देखें".
- Trip 0926-04: ₹3,420, 38 L, profit ₹13,240.
- Ask answer: "Yesterday we earned a profit of ₹1,86,400, and ₹11,430 (127 L of diesel) is unaccounted and doesn't add up."
  - Cites: `/trips/0926-04`, `/trips/0927-02`, `/trips/0926-11`.
  - Provenance line: "From Sharma Roadlines · 1–27 Sep 2026 · Gemini 3.5 Flash · answered in 3.1 s · Urja can be wrong…".

**Selecting a flag on the Map:**
- Map shows `aria-pressed=true`, and the map canvas appears in under 100 ms.
- Tapping flag 2 (RJ14 GA 1182) changes the route to Ahmedabad → Jaipur. The float card reads "RJ14 GA 1182 · Trip 0927-02 · Bill says 250 L · Tank rose 200 L…", and the rail reads "4:50 PM · bill ≠ tank".

**Console errors:** 0 at every tag. 2 per run were ignored as vercel.live: `ERR_TUNNEL_CONNECTION_FAILED @ https://vercel.live/_next-live/feedback/feedback.js`, which the proxy blocks with a 403.

**Failed requests:** only `ERR_ABORTED` on prefetches that the next navigation cancels (`/brief?_rsc=…` and one chunk), plus CARTO tiles cancelled on zoom. Every page rendered complete.

**Time to usable, in ms.** For a navigation, this is click → URL changed and the key element visible (`a.act`, `a.item.first`, `h1` or `.eye-sel`). Step 1 also shows the `load` event. For the Map step, it is click → map canvas visible. For the Ask step, it is open → input visible.

| Step | 375 | 1440 | 375 Fast 3G |
|---|---|---|---|
| 1 `/message` (cold) | 646 (load 1,373) | 304 (load 942) | 695 (load 7,397) |
| 2 → `/brief` | 473 | 431 | 1,423 |
| 3 → `/trips/0926-04` | 1,381 | 1,368 | **6,709** |
| 4 → `/` Today | 530 | 323 | 501 |
| 5 Map canvas | 95 | 80 | 94 |
| 6 Ask open / answer | 431 / 3,622 | 29 / 3,622 | 492 / 3,630 |
| 7 cite → trip | 139 | 153 | 221 |
| 8 → `/why` | 1,071 | 495 | 1,902 |

**Fast 3G:** CDP `Network.emulateNetworkConditions` with latency 562.5 ms, 1.44 Mbps down and 675 kbps up, which is the DevTools preset. The mocked `/api/ask` is answered in the browser, so throttling doesn't apply to it; its time is the 3.1 s mock delay. Cold steps 1, 3 and 8 carry the throttle. The worst step is the first trip page at 6.7 s, where it loads the map and trip chunks. Each later client navigation takes under 2 s.

### Screenshots (`shots/`)
- Each tag (`375`, `1440`, `375-fast3g`) has 9 shots, named `tc020-<tag>-<n>.png`: `1-message`, `2-brief`, `3-trip`, `4-today`, `5a-map`, `5b-flag`, `6-ask`, `7-cite-trip` and `8-why`.
- Full-page shots: `tc020-<tag>-3-trip-full.png` and `tc020-<tag>-4-today-full.png`.
- `tc020-375-5c-flag2-hero.png`: the map hero at 375 with flag 2 selected.
- Contact strips: `strip-375.png` (all 8 steps) and `strip-1440.png` (flag and Ask).

### Observations (not failures)
- At 375, the map's "© CARTO, © OpenStreetMap contributors" chip sits over the map labels near Kishangarh, Behror and Delhi, under the Scene/Map/Fleet switch (`tc020-375-5c-flag2-hero.png`). This is cosmetic; it is a pixel fix and needs no Design Freeze approval.
- `/why` CLS of 0.078 is close to the 0.1 line, so a regression could cross it.
- At 375, the flag card is below the "Needs your eyes" list. After tapping a row, the presenter has to scroll down to see the map change.
