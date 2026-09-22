# Launch Matchday on Railway

Railway suits this version because it runs a persistent Node service with a SQLite volume. Eligible new accounts receive $5 trial credit for up to 30 days; full outbound network access depends on account verification. This is launch credit, not a promise of permanently free hosting. Check [trial terms](https://docs.railway.com/pricing/free-trial) and [volume limits](https://docs.railway.com/volumes/reference).

1. Sign into Railway with GitHub. Create a private GitHub repository containing this source. Exclude `.env`, `data`, `node_modules`, and `dist`; the included ignore files cover these. Keep `.env.example`.
2. Create a Railway project from that repository. The included `railway.json` selects the Dockerfile and health check. Use one replica.
3. Add a persistent volume mounted at `/app/data` before accepting user predictions. Trial/free volume capacity is 0.5 GB. The container entrypoint gives the Node user ownership of the mounted directory before starting the application.
4. Generate a Railway public domain. Set these service variables, then redeploy:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATA_MODE` | `live` |
| `APP_ORIGIN` | Exact generated HTTPS origin, without trailing slash |
| `FOOTBALL_DATA_TOKEN` | Your API token, entered as a secret |
| `DATABASE_PATH` | `/app/data/matchday.sqlite` |
| `SHOW_TEAM_CRESTS` | `true` if permitted for your use |
| `TRUST_PROXY_HOPS` | `1` for a single trusted edge proxy; verify the actual topology before launch |

Railway supplies `PORT`; the server reads it. Leave the start command unset so Docker's entrypoint and command are used. Leave `PREDICTION_CONTRACT_ADDRESS` and `PROJECT_VOTE_URL` unset until the actual deployment and listing exist.

5. Check `/api/health`, verify all five leagues load, and perform wallet login on the public origin. Submit a pre-kickoff pick, restart the service, and confirm that it persists. Check that unrelated clients are not sharing one proxy IP rate limit. Do not add a CDN without revisiting trusted proxy settings.
6. Monitor credit usage and database size. Back up SQLite using its backup API or after a clean shutdown, including any WAL files if present. Free-provider scores are delayed.

## BOT Chain submission remains a separate step

Fund your deployment wallet with enough BOT for gas, deploy the receipt contract using the README instructions, and set its mainnet address. Never upload a deployment private key to the web service. Verify a receipt transaction with your wallet before describing this as a deployed BOT Chain app. Submit the public URL and contract address through the official ecosystem process, then configure the accepted listing URL.

The local app and tests have been checked. This Docker/Railway deployment still needs its first hosted smoke test; no public deployment has been performed yet.
