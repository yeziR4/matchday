import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import {
  isAddress,
  getAddress,
  verifyMessage,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import { createFeed } from "./feed.js";
import {
  isOpen,
  validSelection,
  winningSelection,
  shortAddress,
} from "../shared/game.js";

const hash = (x) => createHash("sha256").update(x).digest("hex");
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
export function createApp(db, config) {
  const app = express();
  const proxyHops = config.trustProxyHops ?? 0;
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5)
    throw new Error("TRUST_PROXY_HOPS must be an integer from 0 to 5");
  if (proxyHops) app.set("trust proxy", proxyHops);
  const feed = createFeed(db, config);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: config.production
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https://crests.football-data.org"],
              connectSrc: ["'self'", "https://rpc.botchain.ai"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: null,
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: "64kb" }));
  app.use(cookieParser());
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 180,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Please wait a minute." },
    }),
  );
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") !== config.origin
    )
      return res
        .status(403)
        .json({ error: "Request origin does not match this app." });
    const token = req.cookies.matchday_session;
    if (token) {
      const s = db
        .prepare("SELECT address FROM sessions WHERE token=? AND expires>?")
        .get(hash(token), Date.now());
      if (s && !(config.mode === "live" && s.address.startsWith("demo:")))
        req.user = db
          .prepare("SELECT * FROM users WHERE address=?")
          .get(s.address);
    }
    next();
  });
  const requireUser = (req, res, next) =>
    req.user
      ? next()
      : res
          .status(401)
          .json({ error: "Connect and sign in with your wallet first." });
  function issueSession(res, address) {
    const token = randomBytes(32).toString("hex");
    const expires = Date.now() + 7 * 86400000;
    db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
      hash(token),
      address,
      expires,
    );
    res.cookie("matchday_session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: config.origin.startsWith("https:"),
      maxAge: 7 * 86400000,
      path: "/",
    });
  }
  function publicUser(u) {
    return u
      ? {
          address: u.address,
          name: u.name,
          practice: u.address.startsWith("demo:"),
        }
      : null;
  }
  app.get("/api/config", (req, res) =>
    res.json({
      name: "Matchday",
      mode: config.mode,
      chain: {
        id: 677,
        hex: "0x2a5",
        name: "BOT Chain",
        rpc: "https://rpc.botchain.ai",
        explorer: "https://scan.botchain.ai",
      },
      voteUrl: config.voteUrl || null,
      contract: config.contract || null,
      crests: config.crests,
      user: publicUser(req.user),
    }),
  );
  app.get("/api/health", (req, res) =>
    res.json({ ok: true, feed: feed.status() }),
  );
  app.get("/api/fixtures", async (req, res) => {
    await feed.sync();
    const now = Date.now();
    res.json({
      matches: feed
        .matches()
        .filter(
          (m) =>
            Date.parse(m.kickoff) > now - 7 * 86400000 &&
            Date.parse(m.kickoff) < now + 35 * 86400000,
        ),
      feed: feed.status(),
      serverTime: now,
    });
  });
  app.post(
    "/api/auth/challenge",
    rateLimit({
      windowMs: 60000,
      limit: 15,
      legacyHeaders: false,
      message: { error: "Please wait before requesting another sign-in." },
    }),
    (req, res) => {
      if (typeof req.body.address !== "string" || !isAddress(req.body.address))
        throw fail("A valid wallet address is required.");
      const address = getAddress(req.body.address);
      const id = randomBytes(16).toString("hex");
      const now = Date.now();
      const message = `${new URL(config.origin).host} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to Matchday. This signature is free and does not submit a vote or authorize a payment.\n\nURI: ${config.origin}\nVersion: 1\nChain ID: 677\nNonce: ${id}\nIssued At: ${new Date(now).toISOString()}\nExpiration Time: ${new Date(now + 300000).toISOString()}`;
      db.prepare("DELETE FROM challenges WHERE expires<?").run(now);
      db.prepare("DELETE FROM sessions WHERE expires<?").run(now);
      db.prepare("INSERT INTO challenges VALUES (?,?,?,?)").run(
        id,
        address.toLowerCase(),
        message,
        now + 300000,
      );
      res.json({ id, message });
    },
  );
  app.post("/api/auth/verify", (req, res) => {
    const { id, signature } = req.body;
    if (typeof id !== "string" || typeof signature !== "string")
      throw fail("Missing wallet signature.");
    const challenge = db
      .prepare("SELECT * FROM challenges WHERE id=? AND expires>?")
      .get(id, Date.now());
    if (!challenge)
      throw fail("Sign-in expired or already used. Please reconnect.", 401);
    let recovered;
    try {
      recovered = verifyMessage(challenge.message, signature).toLowerCase();
    } catch {
      throw fail("Invalid wallet signature.", 401);
    }
    if (recovered !== challenge.address)
      throw fail("Signature does not match this wallet.", 401);
    db.prepare("DELETE FROM challenges WHERE id=?").run(id);
    db.prepare("INSERT OR IGNORE INTO users VALUES (?,?,?)").run(
      recovered,
      shortAddress(recovered),
      Date.now(),
    );
    issueSession(res, recovered);
    res.json({
      user: publicUser(
        db.prepare("SELECT * FROM users WHERE address=?").get(recovered),
      ),
    });
  });
  app.post("/api/auth/practice", (req, res) => {
    if (config.mode !== "demo")
      throw fail("Practice accounts are disabled with real fixtures.", 403);
    const address = `demo:${randomUUID()}`;
    db.prepare("INSERT INTO users VALUES (?,?,?)").run(
      address,
      "Practice player",
      Date.now(),
    );
    issueSession(res, address);
    res.json({ user: { address, name: "Practice player", practice: true } });
  });
  app.post("/api/auth/logout", (req, res) => {
    if (req.cookies.matchday_session)
      db.prepare("DELETE FROM sessions WHERE token=?").run(
        hash(req.cookies.matchday_session),
      );
    res.clearCookie("matchday_session", { path: "/" });
    res.json({ ok: true });
  });
  app.patch("/api/profile", requireUser, (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!/^[\p{L}\p{N} _.-]{2,24}$/u.test(name))
      throw fail(
        "Use 2–24 letters, numbers, spaces, dots, underscores or hyphens.",
      );
    db.prepare("UPDATE users SET name=? WHERE address=?").run(
      name,
      req.user.address,
    );
    res.json({ user: publicUser({ ...req.user, name }) });
  });
  function predictions(address) {
    return db
      .prepare(
        "SELECT * FROM predictions WHERE address=? AND mode=? ORDER BY updated_at DESC",
      )
      .all(address, config.mode)
      .map((p) => {
        const f = db
          .prepare("SELECT payload FROM fixtures WHERE id=?")
          .get(p.fixture_id);
        return {
          ...p,
          match: f ? JSON.parse(f.payload) : null,
          simulated_score: p.simulated_score
            ? JSON.parse(p.simulated_score)
            : null,
        };
      });
  }
  app.get("/api/predictions", requireUser, (req, res) =>
    res.json({ predictions: predictions(req.user.address) }),
  );
  app.post("/api/predictions", requireUser, async (req, res) => {
    const picks = req.body.picks;
    if (!Array.isArray(picks) || !picks.length || picks.length > 100)
      throw fail(
        "Submit between 1 and 100 picks per slip. There is no total prediction limit.",
      );
    await feed.sync();
    if (feed.status().stale)
      throw fail(
        "Fixture updates are temporarily unavailable. New picks are paused until the feed recovers.",
        503,
      );
    const now = Date.now();
    const checked = [];
    const seen = new Set();
    for (const p of picks) {
      if (
        !p ||
        typeof p.fixtureId !== "string" ||
        typeof p.market !== "string" ||
        typeof p.selection !== "string"
      )
        throw fail("Invalid prediction.");
      const key = `${p.fixtureId}:${p.market}`;
      if (seen.has(key))
        throw fail("Only one selection per market is allowed.");
      seen.add(key);
      const row = db
        .prepare("SELECT payload FROM fixtures WHERE id=? AND mode=?")
        .get(p.fixtureId, config.mode);
      if (!row) throw fail("Fixture not found.");
      const match = JSON.parse(row.payload);
      if (!isOpen(match, now))
        throw fail(
          `${match.home.name} vs ${match.away.name} is closed for predictions.`,
        );
      if (!validSelection(match, p.market, p.selection))
        throw fail("That market or selection is not available.");
      const existing = db
        .prepare(
          "SELECT * FROM predictions WHERE address=? AND fixture_id=? AND market=?",
        )
        .get(req.user.address, p.fixtureId, p.market);
      if (existing && existing.outcome !== "pending")
        throw fail("A settled prediction cannot be changed.");
      checked.push({ ...p, match, existing });
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const p of checked) {
        db.prepare(
          `INSERT INTO predictions(id,address,fixture_id,market,selection,outcome,mode,created_at,updated_at) VALUES (?,?,?,?,?,'pending',?,?,?) ON CONFLICT(address,fixture_id,market) DO UPDATE SET selection=excluded.selection,updated_at=excluded.updated_at`,
        ).run(
          p.existing?.id || randomUUID(),
          req.user.address,
          p.fixtureId,
          p.market,
          p.selection,
          config.mode,
          now,
          now,
        );
      }
      const deadline = Math.floor(
        Math.min(...checked.map((p) => Date.parse(p.match.kickoff))) / 1000,
      );
      const payload = JSON.stringify({
        version: 1,
        app: "Matchday",
        mode: config.mode,
        address: req.user.address,
        createdAt: now,
        deadline,
        picks: checked
          .map(({ fixtureId, market, selection }) => ({
            fixtureId,
            market,
            selection,
          }))
          .sort((a, b) =>
            `${a.fixtureId}:${a.market}`.localeCompare(
              `${b.fixtureId}:${b.market}`,
            ),
          ),
      });
      const receipt = {
        id: randomUUID(),
        hash: keccak256(toUtf8Bytes(payload)),
        payload,
        deadline,
        createdAt: now,
      };
      db.prepare("INSERT INTO receipts VALUES (?,?,?,?,?,?)").run(
        receipt.id,
        req.user.address,
        receipt.hash,
        payload,
        deadline,
        now,
      );
      db.exec("COMMIT");
      res.json({ predictions: predictions(req.user.address), receipt });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
  app.get("/api/receipts", requireUser, (req, res) =>
    res.json({
      receipts: db
        .prepare(
          "SELECT id,hash,payload,deadline,created_at AS createdAt FROM receipts WHERE address=? ORDER BY created_at DESC LIMIT 100",
        )
        .all(req.user.address),
    }),
  );
  app.post("/api/demo/settle", requireUser, (req, res) => {
    if (config.mode !== "demo")
      throw fail("Demo settlement is disabled with real fixtures.", 403);
    const pending = db
      .prepare(
        "SELECT * FROM predictions WHERE address=? AND mode='demo' AND outcome='pending'",
      )
      .all(req.user.address);
    for (const p of pending) {
      const index = Number(p.fixture_id.replace("demo-", "")) || 1;
      const home = index % 4,
        away = (index + 1) % 3;
      db.prepare(
        "UPDATE predictions SET outcome=?,simulated_score=? WHERE id=?",
      ).run(
        winningSelection(p.market, home, away, p.selection) ? "won" : "lost",
        JSON.stringify({ home, away }),
        p.id,
      );
    }
    res.json({ predictions: predictions(req.user.address) });
  });
  app.get("/api/leaderboard", (req, res) => {
    const period = req.query.period === "season" ? "season" : "week";
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    if (period === "week")
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    else {
      start.setUTCFullYear(
        start.getUTCMonth() < 6
          ? start.getUTCFullYear() - 1
          : start.getUTCFullYear(),
        6,
        1,
      );
    }
    const end = new Date(start);
    if (period === "week") end.setUTCDate(end.getUTCDate() + 7);
    else end.setUTCFullYear(end.getUTCFullYear() + 1);
    const rows = db
      .prepare(
        `SELECT p.address,u.name,SUM(p.outcome='won') AS points,SUM(p.outcome IN ('won','lost')) AS settled,COUNT(*) AS picks FROM predictions p JOIN users u ON u.address=p.address JOIN fixtures f ON f.id=p.fixture_id WHERE p.mode=? AND json_extract(f.payload,'$.kickoff')>=? AND json_extract(f.payload,'$.kickoff')<? GROUP BY p.address ORDER BY points DESC,CASE WHEN SUM(p.outcome IN ('won','lost'))>0 THEN CAST(SUM(p.outcome='won') AS REAL)/SUM(p.outcome IN ('won','lost')) ELSE 0 END DESC,u.created_at ASC`,
      )
      .all(config.mode, start.toISOString(), end.toISOString());
    let last = null,
      rank = 0;
    const ranked = rows.map((r, i) => {
      const accuracy = r.settled ? r.points / r.settled : 0;
      const key = `${r.points}:${accuracy}`;
      if (key !== last) rank = i + 1;
      last = key;
      return {
        ...r,
        rank,
        accuracy: r.settled ? Math.round(accuracy * 100) : null,
        you: req.user?.address === r.address,
      };
    });
    res.json({
      rows: ranked.slice(0, 100),
      you: ranked.find((r) => r.you) || null,
      total: ranked.length,
      period,
      startsAt: start.toISOString(),
      demo: config.mode === "demo",
    });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API endpoint not found." }),
  );
  app.use((error, req, res, next) => {
    if (!req.path.startsWith("/api")) return next(error);
    res
      .status(error.status || 500)
      .json({
        error: error.status
          ? error.message
          : "Something went wrong. Please try again.",
      });
    if (!error.status) console.error(error.message);
  });
  return { app, feed };
}
