import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function openDatabase(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(address TEXT PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY,address TEXT NOT NULL,message TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,address TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS fixtures(id TEXT PRIMARY KEY, mode TEXT NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS predictions(id TEXT PRIMARY KEY,address TEXT NOT NULL,fixture_id TEXT NOT NULL,market TEXT NOT NULL,selection TEXT NOT NULL,outcome TEXT NOT NULL DEFAULT 'pending',mode TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,simulated_score TEXT, UNIQUE(address,fixture_id,market));
    CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY,address TEXT NOT NULL,hash TEXT NOT NULL,payload TEXT NOT NULL,deadline INTEGER NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS predictions_address ON predictions(address);
    CREATE INDEX IF NOT EXISTS predictions_fixture ON predictions(fixture_id);
  `);
  return db;
}
