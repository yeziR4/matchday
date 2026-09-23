# Matchday — draft ecosystem submission

**Category:** GameFi / Sports

**Short description:** Matchday is a free football prediction competition for BOT Chain. Fans make unlimited predictions across Europe's five biggest leagues, earn one point for every correct pick, and compete on weekly and season leaderboards. Wallet profiles and optional on-chain prediction receipts make their football calls verifiable.

**What is working:** Real fixtures and results from football-data.org; provider-supplied crests with fallbacks; ten score-based prediction markets; wallet signature authentication; server-side kickoff locks; persistent picks; automatic equal-point scoring; weekly and season rankings; downloadable prediction receipts; mobile and desktop layouts.

**Why BOT Chain:** The app gives football fans a reason to create a wallet identity and timestamp their predictions on BOT Chain. The receipt contract records hashes without holding user funds. It offers a low-complexity first on-chain interaction alongside a usable sports product.

**Trust model:** Scoring and fixture ingestion are operated by Matchday. Receipts prove a digest was recorded at a time, not that a result is independently verified. Data can be delayed on the free API tier. The app has no cash stakes or cash prizes. Each wallet is an account; the product does not claim personhood verification.

**Website:** https://matchday-production-1b9f.up.railway.app/

**Source repository:** https://github.com/yeziR4/matchday

**BOT mainnet contract:** 0x5dc66B8F74E581a6b4f5Bbcf79aAFae995546C8a (chain ID 677).

**Deployment transaction:** https://scan.botchain.ai/tx/0xc1fa8a2d794536c0e5f95378c1d682bf83706b1bf022291430681907f65d95eb

Creation and deployed runtime bytecode were independently matched to the local compiled PredictionBook contract. Explorer source-code publication and a user receipt transaction remain separate checks.

**Team / contact / reward address:** To be supplied by the owner.

## 60-second demo sequence

1. Show upcoming real matches and league filters.
2. Open a match and select a result, goals prediction, and exact score.
3. Sign in with a wallet and submit the slip before kickoff.
4. Show the saved picks and export their receipt.
5. If deployed, anchor a receipt on BOT Chain and show its transaction.
6. Show a correctly settled pick and the leaderboard. Use the separate demo mode only if explicitly labeled as a simulation; never present simulated points as real activity.

## Before sending

Replace all pending fields with verified URLs/addresses and actual team information. Confirm listing eligibility with BOT Chain. The leaderboard's rewards are conditional and are not promised to app users.
