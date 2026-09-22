import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { Wallet, keccak256, toUtf8Bytes } from "ethers";
import { openDatabase } from "../server/db.js";
import { createApp } from "../server/app.js";
const origin = "http://localhost:3000";
function setup(mode = "demo") {
  const db = openDatabase(":memory:");
  const { app, feed } = createApp(db, {
    origin,
    mode,
    production: false,
    crests: false,
  });
  return { db, app, feed, client: request.agent(app) };
}
const post = (client, path, body = {}) =>
  client.post(path).set("Origin", origin).send(body);
test("wallet auth verifies signer, prevents replay and keeps sessions private", async () => {
  const { client, db, app } = setup();
  const wallet = Wallet.createRandom();
  const c = await post(client, "/api/auth/challenge", {
    address: wallet.address,
  });
  assert.equal(c.status, 200);
  const wrong = await post(client, "/api/auth/verify", {
    id: c.body.id,
    signature: await Wallet.createRandom().signMessage(c.body.message),
  });
  assert.equal(wrong.status, 401);
  const signature = await wallet.signMessage(c.body.message);
  const signed = await post(client, "/api/auth/verify", {
    id: c.body.id,
    signature,
  });
  assert.equal(signed.status, 200);
  assert.match(signed.headers["set-cookie"][0], /HttpOnly/);
  assert.equal(
    (await post(client, "/api/auth/verify", { id: c.body.id, signature }))
      .status,
    401,
  );
  assert.equal(
    (await client.get("/api/config")).body.user.address,
    wallet.address.toLowerCase(),
  );
  assert.equal((await request(app).get("/api/predictions")).status, 401);
  assert.equal((await client.post("/api/auth/logout").send({})).status, 403);
  await post(client, "/api/auth/logout");
  assert.equal((await client.get("/api/predictions")).status, 401);
  db.close();
});
test("unlimited markets, edits, receipts and no duplicate point farming", async () => {
  const { client, db } = setup();
  await post(client, "/api/auth/practice");
  let r = await post(client, "/api/predictions", {
    picks: [
      { fixtureId: "demo-1", market: "result", selection: "HOME" },
      { fixtureId: "demo-1", market: "btts", selection: "YES" },
    ],
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.predictions.length, 2);
  assert.equal(
    r.body.receipt.hash,
    keccak256(toUtf8Bytes(r.body.receipt.payload)),
  );
  r = await post(client, "/api/predictions", {
    picks: [{ fixtureId: "demo-1", market: "result", selection: "AWAY" }],
  });
  assert.equal(r.body.predictions.length, 2);
  assert.equal(
    r.body.predictions.find((p) => p.market === "result").selection,
    "AWAY",
  );
  r = await post(client, "/api/predictions", {
    picks: [
      { fixtureId: "demo-1", market: "result", selection: "HOME" },
      { fixtureId: "demo-1", market: "result", selection: "AWAY" },
    ],
  });
  assert.equal(r.status, 400);
  await post(client, "/api/demo/settle");
  const p = (await client.get("/api/predictions")).body.predictions;
  assert.equal(p.filter((x) => x.outcome === "won").length, 2);
  let b = (await client.get("/api/leaderboard")).body.rows;
  assert.equal(b[0].points, 2);
  await post(client, "/api/demo/settle");
  b = (await client.get("/api/leaderboard")).body.rows;
  assert.equal(b[0].points, 2);
  assert.equal(
    (
      await post(client, "/api/predictions", {
        picks: [{ fixtureId: "demo-1", market: "result", selection: "HOME" }],
      })
    ).status,
    400,
  );
  db.close();
});
test("server rejects late and invalid picks atomically", async () => {
  const { client, db } = setup();
  await post(client, "/api/auth/practice");
  const row = db
    .prepare("SELECT payload FROM fixtures WHERE id=?")
    .get("demo-1");
  const m = JSON.parse(row.payload);
  m.kickoff = new Date(Date.now() - 1).toISOString();
  db.prepare("UPDATE fixtures SET payload=? WHERE id=?").run(
    JSON.stringify(m),
    "demo-1",
  );
  const r = await post(client, "/api/predictions", {
    picks: [
      { fixtureId: "demo-2", market: "result", selection: "HOME" },
      { fixtureId: "demo-1", market: "result", selection: "HOME" },
    ],
  });
  assert.equal(r.status, 400);
  assert.equal(
    (await client.get("/api/predictions")).body.predictions.length,
    0,
  );
  assert.equal(
    (
      await post(client, "/api/predictions", {
        picks: [
          { fixtureId: "demo-2", market: "result", selection: "INVALID" },
        ],
      })
    ).status,
    400,
  );
  db.close();
});
test("live mode excludes practice auth and rejects demo settlement", async () => {
  const { client, db } = setup("live");
  assert.equal((await post(client, "/api/auth/practice")).status, 403);
  assert.equal((await client.get("/api/leaderboard")).body.rows.length, 0);
  db.close();
});
test("provider corrections recalculate outcomes; a void stays void after rescheduling", async () => {
  const { client, db, feed } = setup();
  await post(client, "/api/auth/practice");
  await post(client, "/api/predictions", {
    picks: [{ fixtureId: "demo-1", market: "result", selection: "HOME" }],
  });
  const m = JSON.parse(
    db.prepare("SELECT payload FROM fixtures WHERE id=?").get("demo-1").payload,
  );
  const save = () =>
    db
      .prepare("UPDATE fixtures SET payload=? WHERE id=?")
      .run(JSON.stringify(m), m.id);
  m.status = "FINISHED";
  m.score = { home: 2, away: 1 };
  save();
  feed.settleAll();
  assert.equal(
    (await client.get("/api/predictions")).body.predictions[0].outcome,
    "won",
  );
  m.score = { home: 1, away: 2 };
  save();
  feed.settleAll();
  assert.equal(
    (await client.get("/api/predictions")).body.predictions[0].outcome,
    "lost",
  );
  m.status = "POSTPONED";
  save();
  feed.settleAll();
  assert.equal(
    (await client.get("/api/predictions")).body.predictions[0].outcome,
    "void",
  );
  m.status = "TIMED";
  save();
  feed.settleAll();
  assert.equal(
    (await client.get("/api/predictions")).body.predictions[0].outcome,
    "void",
  );
  db.close();
});
test("one account cannot read another account receipts", async () => {
  const { client, db, app } = setup();
  await post(client, "/api/auth/practice");
  await post(client, "/api/predictions", {
    picks: [{ fixtureId: "demo-1", market: "result", selection: "HOME" }],
  });
  const other = request.agent(app);
  await post(other, "/api/auth/practice");
  assert.equal((await other.get("/api/receipts")).body.receipts.length, 0);
  assert.equal(
    (await other.get("/api/predictions")).body.predictions.length,
    0,
  );
  db.close();
});
test("a practice cookie cannot authenticate after switching to real fixtures", async () => {
  const { client, db } = setup();
  const r = await post(client, "/api/auth/practice");
  const cookie = r.headers["set-cookie"][0].split(";")[0];
  const live = createApp(db, { origin, mode: "live", production: false }).app;
  const config = await request(live).get("/api/config").set("Cookie", cookie);
  assert.equal(config.body.user, null);
  assert.equal(
    (
      await request(live)
        .post("/api/predictions")
        .set("Cookie", cookie)
        .set("Origin", origin)
        .send({ picks: [] })
    ).status,
    401,
  );
  db.close();
});
test("corrected kickoff voids late predictions", async () => {
  const { client, db, feed } = setup();
  await post(client, "/api/auth/practice");
  await post(client, "/api/predictions", {
    picks: [{ fixtureId: "demo-1", market: "result", selection: "HOME" }],
  });
  const m = JSON.parse(
    db.prepare("SELECT payload FROM fixtures WHERE id=?").get("demo-1").payload,
  );
  m.kickoff = new Date(Date.now() - 3600000).toISOString();
  m.status = "FINISHED";
  m.score = { home: 2, away: 0 };
  db.prepare("UPDATE fixtures SET payload=? WHERE id=?").run(
    JSON.stringify(m),
    m.id,
  );
  feed.settleAll();
  assert.equal(
    (await client.get("/api/predictions")).body.predictions[0].outcome,
    "void",
  );
  db.close();
});
test("next-month predictions cannot inflate this week’s leaderboard", async () => {
  const { client, db } = setup();
  await post(client, "/api/auth/practice");
  const m = JSON.parse(
    db.prepare("SELECT payload FROM fixtures WHERE id=?").get("demo-1").payload,
  );
  m.kickoff = new Date(Date.now() + 30 * 86400000).toISOString();
  db.prepare("UPDATE fixtures SET payload=? WHERE id=?").run(
    JSON.stringify(m),
    m.id,
  );
  await post(client, "/api/predictions", {
    picks: [{ fixtureId: "demo-1", market: "result", selection: "HOME" }],
  });
  assert.equal(
    (await client.get("/api/leaderboard?period=week")).body.rows.length,
    0,
  );
  db.close();
});
