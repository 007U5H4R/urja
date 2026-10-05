# Production: deploy, verification, monitoring and rollback (Stage 11, TSK-16)

**Production URL: https://urja-three.vercel.app**
- Vercel production deployment of `main` at cfcd9c0, the merge of 007U5H4R/urja#1, approved by the user on 2026-10-05.
- The deployment URL is `urja-9ld0dyeg7-tushar-49a6.vercel.app`.
- `NEXT_PUBLIC_SITE_URL` isn't needed. In production, `lib/site.ts` falls back to `VERCEL_PROJECT_PRODUCTION_URL`, and `og:url` and `og:image` resolve to `https://urja-three.vercel.app`.

## Verification (2026-10-05, ~07:00 UTC)
| Check | Result | Evidence |
|---|---|---|
| Public access | PASS | An external fetch, not through this VM's bypass proxy, gets the app page with the title "Today · Urja — Sharma Roadlines", not a Vercel login. |
| TC-050: HTML and og.png | PASS | `/`, `/why`, `/trips/0926-04`, `/brief`, `/message` and `/og-card` return 200. `og:url` and `og:image` point at the production host. `/og.png` returns 200, image/png, 1200×630, 151,669 B, byte-identical to `public/og.png`, both from the VM and from an external fetch. `/og-card` has `robots: noindex, nofollow`. |
| TC-020 on production, 375 px | PASS | `/message` → `/brief` → item 1 → `/trips/0926-04` → Today → Map → flag 1 → Ask → cite → trip → `/why`. ₹1,86,400, ₹11,430, 3 trips, 38 L and ₹3,420 match on every screen, with 0 console errors. Ask was live: Gemini timed out at 8 s, so the labelled deterministic answer showed with the right figures and cites, about 10.7 s end to end. |
| TC-051: LinkedIn Post Inspector, opengraph.xyz | **BLOCKED (needs the user)** | LinkedIn's inspector needs a login, and opengraph.xyz is blocked by this environment's egress policy. Substitute evidence: the production tags and the image are verified above, from outside. The user runs both inspectors on the URL above. |
| Live Ask on production | **Degraded (free tier)** | Two calls: `x-ask-outcome: timeout; model=gemini-3.5-flash`. The fallback is correct and labelled. EXE32 keeps the free tier, and EXE31 limits the waste (cache and cooldowns). |

## Monitoring
- **Vercel runtime logs** (Project urja → Logs, Production): every `/api/ask` request writes one JSON line (`lib/ask/log.ts`) with `outcome`, `mode`, `model`, `ms`, `promptVersion`, `qHash` and `cached`. The question text, the key and the IP never appear.
  - Health query: filter `"outcome":"ok"` against `"outcome":"timeout"|"http_429"|"cooldown"` over the last hour.
  - Many `http_429` or `cooldown` lines mean the free-tier quota is spent.
  - Many `timeout` lines mean Gemini is slow.
  - `"outcome":"error"` should be 0.
- **Spot check:** `curl -s -D - -o /dev/null -H 'content-type: application/json' -d '{"question":"How much did we earn yesterday?"}' https://urja-three.vercel.app/api/ask | grep -i x-ask-outcome`.
- **Release health:**
  - GitHub Actions CI on `main`;
  - the Vercel deployment status on the commit;
  - `pnpm eval --base-url <preview>` for Ask quality. The runner bypasses the cache.

## Rollback
1. **Fastest, no code:** in Vercel → Deployments, choose the previous production deployment → "Promote to Production" (instant rollback). Before this release there was no earlier production of the app.
2. **Ask only:** set `ASK_MODEL` / `ASK_FALLBACK_MODEL` in Vercel, or remove `GEMINI_API_KEY` to force the deterministic answers (`no_key`), then redeploy. Every screen works without the model.
3. **Code:** `git revert -m 1 cfcd9c0` on a branch, then a PR to `main`. Vercel redeploys production from `main`.
