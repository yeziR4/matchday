import test from "node:test";
import assert from "node:assert/strict";
import {
  marketsFor,
  validSelection,
  winningSelection,
  settlement,
  isOpen,
} from "../shared/game.js";
const match = {
  home: { name: "Home" },
  away: { name: "Away" },
  status: "TIMED",
  kickoff: new Date(Date.now() + 3600000).toISOString(),
};
test("all ten markets have valid selectable outcomes", () => {
  assert.equal(marketsFor(match).length, 10);
  for (const m of marketsFor(match))
    for (const o of m.options)
      assert.equal(validSelection(match, m.id, o.value), true);
  assert.equal(validSelection(match, "result", "EVERY_TEAM"), false);
});
test("2–1 settles every market correctly", () => {
  for (const [market, selection] of [
    ["result", "HOME"],
    ["double", "HOME_DRAW"],
    ["double", "HOME_AWAY"],
    ["btts", "YES"],
    ["total_1.5", "OVER"],
    ["total_2.5", "OVER"],
    ["total_3.5", "UNDER"],
    ["home_1.5", "OVER"],
    ["away_1.5", "UNDER"],
    ["margin", "ONE"],
    ["score", "2-1"],
  ])
    assert.equal(
      winningSelection(market, 2, 1, selection),
      true,
      `${market}/${selection}`,
    );
  assert.equal(winningSelection("result", 2, 1, "AWAY"), false);
});
test("draw, zero goals and high scores settle without ambiguity", () => {
  assert.equal(winningSelection("btts", 0, 0, "NO"), true);
  assert.equal(winningSelection("margin", 0, 0, "DRAW"), true);
  assert.equal(winningSelection("double", 0, 0, "HOME_AWAY"), false);
  assert.equal(winningSelection("score", 7, 0, "OTHER"), true);
  assert.equal(winningSelection("score", 6, 6, "6-6"), true);
  assert.throws(() => winningSelection("result", null, 1, "AWAY"));
});
test("mutually exclusive markets always have exactly one winner", () => {
  for (let h = 0; h < 9; h++)
    for (let a = 0; a < 9; a++)
      for (const m of marketsFor(match).filter((m) => m.id !== "double"))
        assert.equal(
          m.options.filter((o) => winningSelection(m.id, h, a, o.value)).length,
          1,
          `${m.id} ${h}:${a}`,
        );
});
test("kickoff, provider status and missing final scores are enforced", () => {
  const now = Date.now();
  assert.equal(
    isOpen({ ...match, kickoff: new Date(now).toISOString() }, now),
    false,
  );
  assert.equal(isOpen({ ...match, status: "IN_PLAY" }), false);
  assert.equal(isOpen(match), true);
  assert.equal(
    settlement(
      { ...match, status: "FINISHED", score: { home: null, away: null } },
      "result",
      "HOME",
    ),
    "pending",
  );
  for (const status of ["POSTPONED", "CANCELLED", "SUSPENDED", "AWARDED"])
    assert.equal(settlement({ ...match, status }, "result", "HOME"), "void");
});
