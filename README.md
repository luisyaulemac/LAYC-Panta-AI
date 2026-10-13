# LAYC Panta AI — Prediction Intelligence Platform

**Hackathon MVP · v0.1.0**

Read-only prediction market intelligence dashboard for the Solana ecosystem, designed around Panta API market data. Includes explainable uncertainty signals, responsive market exploration, and optional grounded AI commentary. **No trades, wallet signing, or transaction execution.**

## Current status

- Cloudflare Workers MVP published by the project owner; live URL supplied separately in Colosseum.
- Demo mode uses clearly labeled fictional market scenarios.
- The Panta API read-only integration adapter is implemented against the published contract, but live authenticated Panta integration is **not yet validated**.
- No private API keys or tokens are stored in the repository.

## Running locally

Requires Node.js 20+.

```bash
npm run check
npm test
npm run dev
```

Local dashboard: `http://localhost:8787`.

## Deploy

```bash
npx wrangler deploy
```

Add `PANTA_API_KEY` through Cloudflare Wrangler secrets to enable live catalog access. **Never commit the key**.

## Project entry

[Colosseum — LAYC Panta AI](https://colosseum.com/arena/projects/layc-panta-ai)

See `docs/SUBMISSION.md` for the submission checklist and honest demo status.
