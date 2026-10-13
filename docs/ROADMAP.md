# Execution plan: October 8–12, 2026

**Hard contest deadline:** Oct 12 23:59 Pacific = Oct 13 01:59 Ecuador. Submit both entries early on Oct 12.

| Date (Ecuador) | Main deliverable | Exit criteria |
|---|---|---|
| Oct 8 | Functional local MVP, stable dashboard and test suite | `npm test` pass, mobile layout manual QA, demo mode clearly marked |
| Oct 9 | Live Panta account / key, upstream integration validation | Real `/markets/`, detail, categories and trade tape inspected; no placeholder prices |
| Oct 10 | Polish data provenance, optional grounded LLM, charts, performance and UX | Network failure handling, keyboard navigation, mobile screenshots, quotas validated |
| Oct 11 | Cloudflare deployment, demo video, pitch copy, basic public test | `*.workers.dev` URL public; one real Panta market works; demo recording complete |
| Oct 12 | Submit Colosseum and Superteam Sidetrack separately | Both confirmation receipts saved well before the night deadline |

## Top technical risks
1. **Panta key/access pending:** live calls not exercised from the build sandbox. Register early. If API is unavailable, report blocker honestly; fictional-only demos are not sufficient proof of meaningful integration.
2. **No historical series in documented endpoints:** show only real browser-observed snapshots for live markets; avoid fake price history.
3. **Market list prices intentionally null:** fetch detailed market spot quote after selection.
4. **Unproven upstream rate limits and free hosting quotas:** use cache, timeouts and manual refresh; test with small catalog pages.
5. **LLM availability / cost:** free deterministic analysis always works; optional paid model can be disabled.
6. **Submission time:** main deadline is not late night in Ecuador; do both submissions early.
