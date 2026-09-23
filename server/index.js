import "dotenv/config";
import express from "express";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { openDatabase } from "./db.js";
import { createApp } from "./app.js";
const production = process.argv.includes("--production");
const port = Number(process.env.PORT || 3000);
const origin = process.env.APP_ORIGIN || `http://localhost:${port}`;
const mode = process.env.DATA_MODE || "demo";
if (!["demo", "live"].includes(mode))
  throw new Error("DATA_MODE must be demo or live");
const voteUrl = process.env.PROJECT_VOTE_URL || "";
if (voteUrl && !/^https:\/\/(www\.)?botchain\.ai\//.test(voteUrl))
  throw new Error(
    "PROJECT_VOTE_URL must point to the official BOT Chain website.",
  );
const db = openDatabase(process.env.DATABASE_PATH || "./data/matchday.sqlite");
const { app, feed } = createApp(db, {
  origin,
  mode,
  production,
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS || 0),
  token: process.env.FOOTBALL_DATA_TOKEN,
  crests: process.env.SHOW_TEAM_CRESTS === "true",
  voteUrl,
  contract: mode === "live"
    ? process.env.PREDICTION_CONTRACT_ADDRESS || "0x5dc66B8F74E581a6b4f5Bbcf79aAFae995546C8a"
    : null,
});
if (production) {
  if (!existsSync("dist/index.html"))
    throw new Error("Run npm run build first.");
  app.use(express.static("dist"));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, hmr: { port: 24678 } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`Matchday is ready at ${origin} (${mode} fixtures)`),
);
const interval = setInterval(() => feed.sync(), 120000);
interval.unref();
feed.sync();
process.on("SIGTERM", () => {
  clearInterval(interval);
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
