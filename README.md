# LAYC Panta AI — Prediction Intelligence Platform

**Hackathon MVP · v0.1.5**

[**Launch live dashboard**](https://layc-panta-ai.luisyaulemac.workers.dev/) · [**GitHub repository**](https://github.com/luisyaulemac/LAYC-Panta-AI) · [**Colosseum project**](https://colosseum.com/arena/projects/17766)

Read-only prediction market intelligence for the Solana ecosystem, built on Panta's official API. Explore catalog data, open individual markets to inspect available YES/NO quotes, compare uncertainty signals and generate explainable rules-based commentary. **No trading, wallet signing, or transaction execution.**

## Verified current status (2026-10-13)

- Public Cloudflare Worker deployed at the dashboard URL above.
- Authenticated **Panta production (Live) API** integration verified end-to-end: list request returned real market identifiers and descriptions; market detail requests returned available YES/NO quotes.
- A private `pk_live_` key is stored as a Cloudflare Worker secret, never in this repository or browser JavaScript.
- Live catalog defaults to Panta's official **secondary (trading) phase** server-side filter, and supports **primary** or **all phases** from the dashboard. Client-side visibility controls can include resolved/ended or untitled rows; cursor pagination requests more entries when the server returns a next cursor.
- **Synchronized details and insights:** explanation responses carry the exact live market quote used to calculate the analysis. The browser updates Market Spotlight and row statistics from that same response to avoid contradictory figures. If Panta omits prices or volume, the interface shows an unavailable state rather than inventing zeroes. The API documentation explains that spot quotes depend on upstream RPC availability.
- The catalog pagination action is visible beside filters when more pages exist; only markets returned by Panta are displayed. On initial Live load, **up to two additional pages** are requested automatically if fewer than six relevant markets are visible, keeping catalog discovery bounded and transparent.
- Demo mode is separately labeled and uses fictional scenarios and synthetic chart observations.
- **Rules-based explanations are available without paid AI.** Optional external generative AI requires separate configuration and is not currently enabled. Do not interpret explanations as market forecasts. End-of-market times, when available, are included in the explanation and Spotlight in UTC.
- **New: verifiable read-only market activity.** On market selection, the Worker fetches Panta's documented trades endpoint and displays actual returned trade count, summed reported YES/NO share amounts (sample only), latest available block time, and verified-format transaction signatures linked to Solana Explorer. If no rows or data are available, it says so. No trading or signing is introduced.
- Historical live charts require successive local browser snapshots; historical data is not fabricated. A visible **live data-coverage strip** separates catalog records, currently filtered records, detailed markets checked, and markets that actually have available quote pairs.
- Judges can directly open the recorded demo, open-source implementation and Colosseum project from the hero section. The default sort highlights approaching market deadlines; requested user sort and phase choices remain available.
- Colosseum and Superteam Earn Panta Sidetrack submissions were received before these latest UI improvements. The submitted videos may show an earlier build.

## Running locally

Requires Node.js 20+.

```bash
npm run check
npm test
npm run dev
```

Local dashboard: `http://localhost:8787`.

## Deploying safely

```bash
npx wrangler deploy
```

Set `PANTA_API_KEY` using Wrangler's encrypted Worker secrets, not source control. Live markets are read-only and no user funds are involved.

## Technical design

Frontend assets in `web/` + Cloudflare Worker in `worker/` + Panta adapter in `src/panta.mjs` + deterministic analysis in `src/analytics.mjs`. The key never leaves the server; market data is normalized and cached briefly, with category/search/sort filters and explicit unavailable-price states.

**Note:** Live catalog rows may omit titles or quotes; detail lookups can return richer data where supplied by Panta. Resolved results (e.g. 100% YES) are not forward-looking predictions.

[Pitch video](https://www.youtube.com/watch?v=cC227n0Lwxw) · [Recorded demo](https://www.youtube.com/watch?v=akCzuvhDPU0) · [Submission history](docs/SUBMISSION.md)
