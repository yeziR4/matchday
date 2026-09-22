import test from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../server/db.js";
import { createFeed } from "../server/feed.js";
test("provider quota headers pause refreshes instead of hammering the API", async () => {
  const db = openDatabase(":memory:");
  let calls = 0;
  const feed = createFeed(db, {
    mode: "live",
    token: "test-token",
    fetch: async () => {
      calls++;
      return new Response(
        JSON.stringify({ matches: [], competition: { code: "PL" } }),
        {
          headers: {
            "x-requests-available-minute": "0",
            "x-requestcounter-reset": "60",
          },
        },
      );
    },
  });
  await feed.sync(true);
  await feed.sync(true);
  assert.equal(calls, 1);
  assert.match(feed.status().error, /rate limit/);
  db.close();
});
test("429 Retry-After is respected even by a forced refresh", async () => {
  const db = openDatabase(":memory:");
  let calls = 0;
  const feed = createFeed(db, {
    mode: "live",
    token: "test-token",
    fetch: async () => {
      calls++;
      return new Response("{}", {
        status: 429,
        headers: { "retry-after": "120" },
      });
    },
  });
  await feed.sync(true);
  await feed.sync(true);
  assert.equal(calls, 1);
  assert.match(feed.status().error, /429/);
  db.close();
});
test("season schedules and recent results are cached; no secret is returned to clients", async () => {
  const db = openDatabase(":memory:");
  let calls = 0;
  const token = "server-only-secret";
  const kickoff = new Date(Date.now() + 20 * 86400000).toISOString();
  const feed = createFeed(db, {
    mode: "live",
    token,
    crests: true,
    fetch: async (url, options) => {
      calls++;
      assert.equal(options.headers["X-Auth-Token"], token);
      if (url.includes("dateFrom")) {
        const u = new URL(url);
        assert.ok(
          Date.parse(u.searchParams.get("dateTo")) -
            Date.parse(u.searchParams.get("dateFrom")) <=
            10 * 86400000,
        );
      }
      return new Response(
        JSON.stringify({
          competition: { code: "PL" },
          matches: url.includes("competitions/PL/")
            ? [
                {
                  id: 123,
                  homeTeam: {
                    id: 1,
                    name: "Home",
                    tla: "HOM",
                    crest: "https://crests.football-data.org/1.svg",
                  },
                  awayTeam: { id: 2, name: "Away", tla: "AWY" },
                  utcDate: kickoff,
                  status: "TIMED",
                  score: { fullTime: { home: null, away: null } },
                },
              ]
            : [],
        }),
        { headers: { "x-requests-available-minute": "5" } },
      );
    },
  });
  await feed.sync();
  assert.equal(calls, 6);
  assert.equal(feed.matches().length, 1);
  assert.equal(
    feed.matches()[0].home.crest,
    "https://crests.football-data.org/1.svg",
  );
  assert.equal(feed.status().stale, false);
  assert.equal(JSON.stringify(feed.status()).includes(token), false);
  await feed.sync();
  assert.equal(calls, 6);
  db.close();
});
