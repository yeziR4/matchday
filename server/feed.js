import { LEAGUES, settlement } from "../shared/game.js";
import { demoMatches } from "./demo.js";
export function createFeed(db, config) {
  const mode = config.mode;
  const setMeta = (k, v) =>
    db
      .prepare("INSERT OR REPLACE INTO meta VALUES (?,?)")
      .run(`${mode}:${k}`, String(v));
  const getMeta = (k) =>
    db.prepare("SELECT value FROM meta WHERE key=?").get(`${mode}:${k}`)?.value;
  const save = (m) =>
    db
      .prepare("INSERT OR REPLACE INTO fixtures VALUES (?,?,?,?)")
      .run(m.id, mode, JSON.stringify(m), Date.now());
  function saveProviderMatch(m) {
    if (
      !LEAGUES.some((l) => l.code === m.competition?.code) ||
      !m.homeTeam?.id ||
      !m.awayTeam?.id
    )
      return;
    const team = (x) => ({
      id: x.id,
      name: x.shortName || x.name,
      short: x.tla || x.name.slice(0, 3).toUpperCase(),
      crest:
        config.crests &&
        /^https:\/\/crests\.football-data\.org\//.test(x.crest || "")
          ? x.crest
          : null,
    });
    save({
      id: String(m.id),
      league: m.competition.code,
      home: team(m.homeTeam),
      away: team(m.awayTeam),
      kickoff: m.utcDate,
      status: m.status,
      score: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
      matchday: m.matchday,
      demo: false,
    });
  }
  if (
    mode === "demo" &&
    !db.prepare("SELECT id FROM fixtures WHERE mode=? LIMIT 1").get(mode)
  ) {
    demoMatches().forEach(save);
    setMeta("updated", Date.now());
  }
  let inFlight = null;
  let throttleUntil = 0;
  async function request(path) {
    if (Date.now() < throttleUntil)
      throw new Error(
        "Football provider rate limit reached. Refresh is scheduled automatically.",
      );
    const response = await (config.fetch || fetch)(
      `https://api.football-data.org/v4/${path}`,
      {
        headers: { "X-Auth-Token": config.token },
        signal: AbortSignal.timeout(15000),
      },
    );
    const available = response.headers.get("x-requests-available-minute");
    const reset = Math.max(
      1,
      Number(response.headers.get("x-requestcounter-reset")) || 60,
    );
    if (available !== null) {
      setMeta("requestsRemaining", available);
      if (Number(available) === 0) throttleUntil = Date.now() + reset * 1000;
    }
    if (response.status === 429) {
      const retry = response.headers.get("retry-after");
      const seconds =
        retry && Number.isFinite(Number(retry))
          ? Number(retry)
          : retry
            ? Math.max(1, (Date.parse(retry) - Date.now()) / 1000)
            : reset;
      throttleUntil = Date.now() + Math.max(reset, seconds || 60) * 1000;
    }
    if (!response.ok)
      throw new Error(
        `Football data request failed (${response.status}). ${response.status === 429 ? "Refresh will retry after the rate-limit window." : "Please check your API plan and key."}`,
      );
    return response.json();
  }
  function matches() {
    return db
      .prepare(
        "SELECT payload FROM fixtures WHERE mode=? ORDER BY json_extract(payload,'$.kickoff')",
      )
      .all(mode)
      .map((r) => JSON.parse(r.payload));
  }
  function settleAll() {
    const update = db.prepare("UPDATE predictions SET outcome=? WHERE id=?");
    for (const p of db
      .prepare(
        "SELECT * FROM predictions WHERE mode=? AND simulated_score IS NULL AND outcome!='void'",
      )
      .all(mode)) {
      const row = db
        .prepare("SELECT payload FROM fixtures WHERE id=? AND mode=?")
        .get(p.fixture_id, mode);
      if (row) {
        const fixture = JSON.parse(row.payload);
        // A corrected earlier kickoff must not reward picks made after that kickoff.
        const late = p.updated_at >= Date.parse(fixture.kickoff);
        update.run(
          late ? "void" : settlement(fixture, p.market, p.selection),
          p.id,
        );
      }
    }
  }
  async function sync(force = false) {
    if (mode === "demo") return;
    if (inFlight) return inFlight;
    if (
      Date.now() < throttleUntil ||
      (!force && Date.now() - Number(getMeta("attempt") || 0) < 60000)
    )
      return;
    inFlight = (async () => {
      setMeta("attempt", Date.now());
      try {
        if (!config.token)
          throw new Error("Add FOOTBALL_DATA_TOKEN to enable real fixtures.");
        // Daily season schedules keep future matchdays visible during international breaks.
        for (const league of LEAGUES) {
          if (
            Date.now() - Number(getMeta(`schedule:${league.code}`) || 0) <
            86400000
          )
            continue;
          const season = await request(`competitions/${league.code}/matches`);
          if (!Array.isArray(season.matches))
            throw new Error(
              "Football provider returned an invalid season schedule.",
            );
          season.matches.forEach((m) =>
            saveProviderMatch({
              ...m,
              competition: m.competition || season.competition,
            }),
          );
          setMeta(`schedule:${league.code}`, Date.now());
        }
        // One shared cached request for the five leagues; never one request per visitor.
        const from = new Date(Date.now() - 2 * 86400000)
          .toISOString()
          .slice(0, 10);
        const to = new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .slice(0, 10);
        // The provider permits a maximum ten-day date range.
        const data = await request(
          `matches?competitions=PL,PD,SA,BL1,FL1&dateFrom=${from}&dateTo=${to}`,
        );
        if (!Array.isArray(data.matches))
          throw new Error(
            "Football provider returned an invalid fixture list.",
          );
        data.matches.forEach(saveProviderMatch);
        // Revisit old unresolved fixtures outside the rolling window, e.g. rescheduled matches.
        const unresolved = db
          .prepare(
            "SELECT DISTINCT p.fixture_id FROM predictions p JOIN fixtures f ON f.id=p.fixture_id WHERE p.mode='live' AND p.outcome!='void' AND json_extract(f.payload,'$.kickoff') < ? AND (p.outcome='pending' OR json_extract(f.payload,'$.kickoff')>?) ORDER BY f.updated_at ASC",
          )
          .all(
            new Date(Date.now() - 2 * 86400000).toISOString(),
            new Date(Date.now() - 7 * 86400000).toISOString(),
          )
          .map((x) => x.fixture_id)
          .filter((x) => /^\d+$/.test(x));
        if (unresolved.length) {
          const old = await request(
            `matches?ids=${unresolved.slice(0, 50).join(",")}`,
          );
          for (const m of old.matches || []) {
            const existing = db
              .prepare("SELECT payload FROM fixtures WHERE id=?")
              .get(String(m.id));
            if (existing) {
              const f = JSON.parse(existing.payload);
              save({
                ...f,
                kickoff: m.utcDate,
                status: m.status,
                score: {
                  home: m.score?.fullTime?.home ?? null,
                  away: m.score?.fullTime?.away ?? null,
                },
              });
            }
          }
        }
        settleAll();
        setMeta("updated", Date.now());
        setMeta("error", "");
      } catch (error) {
        setMeta("error", error.message);
      }
    })().finally(() => (inFlight = null));
    return inFlight;
  }
  function status() {
    const updated = Number(getMeta("updated") || 0);
    return {
      mode,
      updatedAt: updated || null,
      stale: mode === "live" && Date.now() - updated > 10 * 60000,
      error: getMeta("error") || null,
      delayed: mode === "live",
    };
  }
  return { matches, sync, status, settleAll };
}
