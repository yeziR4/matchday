export const LEAGUES = [
  {
    code: "PL",
    name: "Premier League",
    country: "England",
    short: "PL",
    color: "#ac8ceb",
  },
  {
    code: "PD",
    name: "La Liga",
    country: "Spain",
    short: "LL",
    color: "#ff9269",
  },
  {
    code: "SA",
    name: "Serie A",
    country: "Italy",
    short: "SA",
    color: "#66b7ff",
  },
  {
    code: "BL1",
    name: "Bundesliga",
    country: "Germany",
    short: "BL",
    color: "#f47f87",
  },
  {
    code: "FL1",
    name: "Ligue 1",
    country: "France",
    short: "L1",
    color: "#d3e780",
  },
];
const option = (value, label) => ({ value, label });
export function marketsFor(match) {
  return [
    {
      id: "result",
      name: "Match result",
      short: "1X2",
      options: [
        option("HOME", match.home.name),
        option("DRAW", "Draw"),
        option("AWAY", match.away.name),
      ],
    },
    {
      id: "double",
      name: "Double chance",
      options: [
        option("HOME_DRAW", "Home or draw"),
        option("AWAY_DRAW", "Away or draw"),
        option("HOME_AWAY", "Either team"),
      ],
    },
    {
      id: "btts",
      name: "Both teams to score",
      options: [option("YES", "Yes"), option("NO", "No")],
    },
    ...[1.5, 2.5, 3.5].map((line) => ({
      id: `total_${line}`,
      name: `Total goals · ${line}`,
      options: [
        option("OVER", `Over ${line}`),
        option("UNDER", `Under ${line}`),
      ],
    })),
    ...["home", "away"].map((side) => ({
      id: `${side}_1.5`,
      name: `${match[side].name} goals · 1.5`,
      options: [option("OVER", "Over 1.5"), option("UNDER", "Under 1.5")],
    })),
    {
      id: "margin",
      name: "Winning margin",
      options: [
        option("DRAW", "Draw"),
        option("ONE", "1 goal"),
        option("TWO", "2 goals"),
        option("THREE_PLUS", "3+ goals"),
      ],
    },
    {
      id: "score",
      name: "Correct score",
      options: [
        ...Array.from({ length: 7 }, (_, h) =>
          Array.from({ length: 7 }, (_, a) => option(`${h}-${a}`, `${h}–${a}`)),
        ).flat(),
        option("OTHER", "Any other score"),
      ],
    },
  ];
}
export function validSelection(match, market, selection) {
  return marketsFor(match).some(
    (m) => m.id === market && m.options.some((o) => o.value === selection),
  );
}
export function winningSelection(market, h, a, selection) {
  if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0)
    throw new Error("A confirmed non-negative score is required");
  if (market === "result")
    return selection === (h > a ? "HOME" : h < a ? "AWAY" : "DRAW");
  if (market === "double")
    return selection === "HOME_DRAW"
      ? h >= a
      : selection === "AWAY_DRAW"
        ? a >= h
        : selection === "HOME_AWAY"
          ? h !== a
          : false;
  if (market === "btts") return selection === (h > 0 && a > 0 ? "YES" : "NO");
  if (/^(total|home|away)_(1\.5|2\.5|3\.5)$/.test(market)) {
    const [kind, line] = market.split("_");
    const goals = kind === "total" ? h + a : kind === "home" ? h : a;
    return selection === (goals > Number(line) ? "OVER" : "UNDER");
  }
  if (market === "margin")
    return (
      selection ===
      (h === a
        ? "DRAW"
        : Math.abs(h - a) === 1
          ? "ONE"
          : Math.abs(h - a) === 2
            ? "TWO"
            : "THREE_PLUS")
    );
  if (market === "score")
    return selection === (h > 6 || a > 6 ? "OTHER" : `${h}-${a}`);
  throw new Error("Unknown market");
}
export function settlement(match, market, selection) {
  if (["POSTPONED", "CANCELLED", "SUSPENDED", "AWARDED"].includes(match.status))
    return "void";
  if (
    match.status !== "FINISHED" ||
    !Number.isInteger(match.score?.home) ||
    !Number.isInteger(match.score?.away)
  )
    return "pending";
  return winningSelection(market, match.score.home, match.score.away, selection)
    ? "won"
    : "lost";
}
export function isOpen(match, now = Date.now()) {
  return (
    ["SCHEDULED", "TIMED"].includes(match.status) &&
    Number.isFinite(Date.parse(match.kickoff)) &&
    Date.parse(match.kickoff) > now
  );
}
export function shortAddress(address = "") {
  return address.startsWith("demo:")
    ? "Practice player"
    : `${address.slice(0, 6)}…${address.slice(-4)}`;
}
