# Matchday

A football prediction competition for BOT Chain. Five leagues, ten score-based markets, unlimited predictions, and one point per correct pick. No monetary stakes or cash prizes.

## Run locally

Requires Node.js 22.13+ (the backend uses Node's built-in SQLite module).

```sh
npm ci
# Copy .env.example to .env, then edit the configuration locally.
npm run dev
```

Open http://localhost:3000. The local `.env` is ignored by Git and Docker. Never put the football token in `VITE_*` variables, a public config file, or the frontend.

For a production build:

```sh
npm run build
npm start
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `APP_ORIGIN` | Exact public origin, including scheme and port if present, with no trailing slash. Must match the browser URL for sign-in and writes. |
| `PORT` | HTTP port; default 3000. |
| `DATA_MODE` | `live` uses football-data.org; `demo` uses clearly labeled fictional fixtures. |
| `FOOTBALL_DATA_TOKEN` | Server-only API token. |
| `DATABASE_PATH` | Durable SQLite file; default `./data/matchday.sqlite`. |
| `SHOW_TEAM_CRESTS` | Display provider-supplied club crests. Check the provider and relevant rights before public release; assets remain the owners' property. |
| `PROJECT_VOTE_URL` | Our accepted official BOT Chain project listing. Until configured, the interface explains that listing is pending. |
| `PREDICTION_CONTRACT_ADDRESS` | Deployed `PredictionBook` address on BOT Chain mainnet. Until configured, no anchoring transaction is offered. |

Restart the server after changing `.env`. Do not replace the SQLite file to switch data modes: demo/live predictions are partitioned and practice sessions cannot authenticate in live mode.

## Football feed

- football-data.org v4; competitions PL, PD, SA, BL1, FL1 only.
- Daily season schedules, plus shared recent-score refreshes approximately every two minutes.
- Upcoming fixtures for the next 35 days and results from the previous seven days are exposed to the browser; all fetched fixtures are retained for prediction history.
- Server caching, one in-flight refresh, provider quota headers and Retry-After backoff.
- Free-tier score updates are delayed. No in-play picks; app locks picks using server time and provider status.
- A stale feed (over ten minutes since a successful refresh) pauses new submissions.
- On old fixtures, pending results continue refreshing; recent settled results are revisited for corrections.
- Attribution is visible in the app. Club crests have initials fallbacks.

## Accounts, game rules and storage

Sign-in uses a domain-bound, expiring nonce message and verifies the recovered Ethereum address. Sessions use random tokens stored hashed in SQLite and HttpOnly/SameSite cookies. HTTPS origins receive Secure cookies. Every write checks the exact Origin. The app supports injected EVM wallets and EIP-6963 wallet discovery. WalletConnect/QR login is not included; mobile users can use their wallet's browser.

One selection per account, fixture, and market is enforced by a database constraint. Edits replace existing pending picks before kickoff. There is no overall prediction limit. API requests are processed in batches up to 100 picks; the interface automatically submits large slips in consecutive batches. Every successful pick is +1, incorrect/void picks are 0. Rankings use points then accuracy; remaining ties share a rank.

Markets: 1X2, double chance, BTTS, over/under 1.5/2.5/3.5 total goals, home/away over/under 1.5, winning margin, and exact score (0–6 per team plus an “other” outcome). Markets use full-time league results, including stoppage time. Postponed, cancelled, suspended or awarded fixtures void existing predictions when reported. A void remains void if that provider fixture is later rescheduled. Replays with new fixture IDs can accept fresh picks.

Weekly periods start Monday 00:00 UTC. Seasons start July 1. A prediction belongs to its fixture kickoff period. Each wallet is an account, not proof of a unique person. There is no claim of Sybil resistance.

## BOT Chain integration

Mainnet: chain ID 677; RPC https://rpc.botchain.ai; explorer https://scan.botchain.ai. Testnet: chain ID 968; RPC https://rpc.bohr.life. Verified against official BOT documentation during the build.

Picks and scoring are hosted by Matchday. Each submitted slip gets a downloadable JSON receipt whose exact `payload` string hashes to `hash` using Ethereum Keccak-256. Optional anchoring records that hash and its timestamp on BOT Chain before the receipt's earliest match kickoff.

`PredictionBook` holds no funds and has no administrator. It proves that a wallet recorded a digest at a time; it does not verify scores, know fixture deadlines, or prove that a receipt is the user's final revision. Auditors must compare the payload, player, actual fixture cutoff, and any later revisions. The default UI does not imply that an unanchored receipt is on-chain.

```sh
npm run contract:compile
# Set DEPLOYER_PRIVATE_KEY in the local process environment, never in source control.
node scripts/deploy-contract.js                 # testnet estimate only
node scripts/deploy-contract.js --send          # testnet transaction
node scripts/deploy-contract.js --mainnet       # mainnet estimate only
node scripts/deploy-contract.js --mainnet --send # mainnet transaction; needs BOT gas
```

Set the resulting mainnet address in `PREDICTION_CONTRACT_ADDRESS`, restart, and test with a fresh receipt before kickoff. Explorer verification can use the Solidity standard input saved in `artifacts/PredictionBook.json`.

Official ecosystem voting is separate from signup and predictions. The app links to our listing when available; it never silently submits votes. A supporter must confirm the official transaction and pay its gas. No unaudited voting contract integration is included.

## Validation

```sh
npm test
npm run build
npm audit
npm run contract:compile
```

For the on-chain receipt smoke test, start an ephemeral local Ganache node in another terminal:

```sh
npx --yes ganache@7.9.2 --server.host 127.0.0.1 --server.port 8545 --wallet.totalAccounts 2 --logging.quiet true
node scripts/test-contract.js
```

This script is fixed to localhost and chain ID 1337. It does not access funded wallets or a real chain.

## Deployment

The production build is a single Node server serving both the API and frontend. Run **one instance** with a durable local disk for SQLite behind an HTTPS reverse proxy. Do not put this version on ephemeral/serverless storage or multiple replicas. Back up the SQLite database with its SQLite backup API or during a clean shutdown (copying only the main file during active WAL writes is insufficient).

The Dockerfile builds without including `.env`. Mount a persistent volume at `/app/data`, set `DATA_MODE=live`, `APP_ORIGIN` to the public HTTPS origin, and supply the football token as a runtime secret. Route the proxy to port 3000. Outbound HTTPS is required for the football API. Configure trusted-proxy handling for the deployment's precise topology before relying on per-client IP rate limiting; the default conservatively does not trust forwarded IP headers.

## Remaining launch dependencies

1. Public hosting with durable storage and a domain/HTTPS origin.
2. A funded BOT deployment wallet, mainnet contract deployment and explorer verification.
3. An accepted ecosystem listing and its actual vote URL.
4. A real injected-wallet/browser transaction check on the deployed origin.

The local preview is a working app, not a claim that the project is already deployed or accepted by BOT Chain. The email verification link from the data provider must be completed by the account owner if desired.

## Assets

The Matchday mark and football illustration are original SVG artwork. DM Sans and Manrope are self-hosted Google Fonts under the SIL Open Font License; license texts are in `public/fonts`. Lucide supplies interface icons. BOT-inspired colors do not imply official affiliation.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway launch steps and persistent storage configuration.
