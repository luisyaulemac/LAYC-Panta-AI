# Hackathon submission package — English draft

> Draft — do not submit or claim real live integration until the Panta API key is configured and verified.

## Project name
LAYC Panta AI — Prediction Intelligence Platform

## Short pitch
**Turn prediction-market activity into explainable intelligence, without making a trade.** LAYC Panta AI is a lightweight analytics terminal built around the Panta API. Users can discover prediction markets, inspect market-implied YES/NO prices, identify uncertain events and analyze observable changes through a clear dashboard. Optional generative AI translates structured signals into grounded explanations.

## Problem
Prediction-market data often stays locked inside trading workflows. Researchers, creators, businesses and curious non-traders need accessible, interpretable signals — without wallets, orders or technical blockchain knowledge.

## Solution and differentiation
- **Discover:** browse Panta's catalog by volume, search and category.
- **Understand:** show detailed YES/NO quotes, separating absent prices from valid zeros.
- **Explain:** identify high uncertainty, imbalanced quotes, low volume and locally observed changes.
- **Trust:** a read-only interface that separates real Panta data from fictional examples and never promises predictive certainty.
- **Extend:** modular adapter enables additional compliant research tools, multilingual summaries and sector-specific signal feeds later.

## How Panta is used
The server calls Panta's official **read-only** HTTP API:

1. `GET /markets/` — paginated USDC market catalog (title, category, phase, volume, marketId).
2. `GET /markets/{marketId}/` — live spot prices and detailed market metadata where available.
3. `GET /markets/{marketId}/trades/` — supported read-only trade tape adapter (currently available at backend route; not a main dashboard widget).

Authentication via server-side `X-Api-Key`, not browser-side. Panta markets are central to the user experience; no transaction building or signing is necessary for this non-trading use case.

## Architecture
Static web frontend + Cloudflare Worker + Panta API + deterministic signal engine. Optional OpenAI-compatible LLM server call is triggered only after the user requests an insight. Browser stores limited timestamped observations to avoid simulating real history.

## Business model hypothesis (not traction)
A free public dashboard for market discovery, with future paid B2B research alerts, API data intelligence, creator widgets and multilingual explanations. This model has not been validated with customers; do not invent users or revenue.

## Current demo limitations
The provided local demo uses **fictional** Panta-like scenarios and synthetic chart sequences. A public deployed link, configured production Panta API key, real live market screenshots, user testing, and final video still must be completed. We will show authentic integrations only after end-to-end testing.

## Video walkthrough outline (90–120 seconds)
- 0:00 — Who needs market intelligence without trading?
- 0:15 — Select **Live Panta API** (only after key and deployment work), show catalog provenance.
- 0:35 — Search and sort, open market, inspect YES/NO spot prices.
- 0:55 — Display uncertainty and alert interpretation.
- 1:15 — Generate grounded insight and show why it is not a prediction.
- 1:35 — Explain modular architecture, Panta endpoints, and zero-trading posture.
- 1:55 — Call to action / project GitHub and live app.

## Colosseum form: materials to prepare
- A project name, description (up to 500 characters), website, category, location and a product image/logo.
- GitHub repository link (may be private if the judging address is granted access).
- A presentation/pitch video (the field guidance reports up to 2 minutes) and a separate demo video (up to 3 minutes). Follow the final live portal instructions if they differ.
- A team contact on Telegram and X profile.
- Product/problem statement (up to 1,000 characters), timing/motivation (up to 1,000), actual tech stack/chains and how Solana is used (up to 500).
- Product demand evidence, competitor analysis, monetization plan and progress/traction statements — truthful, without invented customers.
- Answer team, external contributors, previous work, entity/funding and accelerator questions accurately.

Sources: [Colosseum official FAQ](https://colosseum.com/hackathon?year=fall2026) and [Superteam guide to the submission form](https://tr.superteam.fun/colosseum/the-form-itself).

## Submission checklist
- [ ] Create Colosseum account, register for official hackathon.
- [ ] Confirm eligibility and only one project/team.
- [ ] Add project and complete required fields in English.
- [ ] Obtain Panta API key and store as Cloudflare Worker secret.
- [ ] Prove the live Panta list and detail calls work; capture evidence.
- [ ] Record functional demo, ideally with live data; clearly label demo scenarios.
- [ ] Deploy and test public stable URL (desktop/mobile, failure states).
- [ ] Decide whether to open source code; disclose pre-hackathon code if any.
- [ ] Submit to Colosseum before its deadline.
- [ ] Submit separately to Panta Sidetrack on Superteam Earn.
- [ ] Keep confirmation screenshots/links of both submissions.

## Authoritative links
- https://superteam.fun/earn/listing/panta-api-side-track
- https://colosseum.com/hackathon?year=fall2026
- https://colosseum.com/legal/Crypto%20World%27s%20Fair%20Hackathon%20Rules.pdf
- https://github.com/Kaito-HQ/panta-api-pub
- https://github.com/Kaito-HQ/panta-api-playground
