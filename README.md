# LAYC Panta AI — Prediction Intelligence Platform

**Hackathon MVP · v0.1.1**

[**Launch live dashboard**](https://layc-panta-ai.luisyaulemac.workers.dev/) · [**GitHub repository**](https://github.com/luisyaulemac/LAYC-Panta-AI) · [**Colosseum project**](https://colosseum.com/arena/projects/17766)

Read-only prediction market intelligence for the Solana ecosystem, built on Panta's official API. Explore catalog data, open individual markets to inspect available YES/NO quotes, compare uncertainty signals and generate explainable rules-based commentary. **No trading, wallet signing, or transaction execution.**

## Verified current status (2026-10-13)

- Public Cloudflare Worker deployed at the dashboard URL above.
- Authenticated **Panta production (Live) API** integration verified end-to-end: list request returned real market identifiers and descriptions; market detail requests returned available YES/NO quotes.
- A private `pk_live_` key is stored as a Cloudflare Worker secret, never in this repository or browser JavaScript.
- Live catalog prioritizes **named, non-resolved, non-expired** markets. Use visibility controls to include resolved or untitled rows; use the pagination control to request more catalog entries where available.
- Demo mode is separately labeled and uses fictional scenarios and synthetic chart observations.
- **Rules-based explanations are available without paid AI.** Optional external generative AI requires separate configuration and is not currently enabled. Do not interpret explanations as market forecasts.
- Historical live charts require successive local browser snapshots; historical data is not fabricated.
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
