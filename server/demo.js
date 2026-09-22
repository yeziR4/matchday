const t = (id, name, short, color) => ({ id, name, short, color, crest: null });
export function demoMatches(now = Date.now()) {
  const teams = [
    [
      "PL",
      t(57, "Arsenal", "ARS", "#c6454c"),
      t(61, "Chelsea", "CHE", "#386ed0"),
    ],
    [
      "PL",
      t(64, "Liverpool", "LIV", "#d55256"),
      t(65, "Manchester City", "MCI", "#81b9d9"),
    ],
    [
      "PD",
      t(86, "Real Madrid", "RMA", "#c9bc80"),
      t(81, "Barcelona", "BAR", "#c86693"),
    ],
    [
      "SA",
      t(108, "Inter", "INT", "#5796e5"),
      t(98, "AC Milan", "MIL", "#d45858"),
    ],
    [
      "BL1",
      t(5, "Bayern Munich", "BAY", "#d75b6c"),
      t(4, "Dortmund", "BVB", "#e6cd4e"),
    ],
    [
      "FL1",
      t(524, "Paris Saint-Germain", "PSG", "#758ed5"),
      t(516, "Marseille", "OM", "#60bed9"),
    ],
    [
      "PL",
      t(66, "Manchester United", "MUN", "#d56458"),
      t(73, "Tottenham", "TOT", "#ced4e4"),
    ],
    [
      "PD",
      t(78, "Atlético Madrid", "ATM", "#e18081"),
      t(77, "Athletic Club", "ATH", "#c66161"),
    ],
    [
      "SA",
      t(109, "Juventus", "JUV", "#dddfe5"),
      t(113, "Napoli", "NAP", "#5aaed4"),
    ],
    [
      "BL1",
      t(3, "Leverkusen", "B04", "#f08a83"),
      t(721, "RB Leipzig", "RBL", "#b1b5d1"),
    ],
    [
      "FL1",
      t(548, "Monaco", "ASM", "#d56262"),
      t(523, "Lyon", "OL", "#8a98dc"),
    ],
    [
      "PL",
      t(67, "Newcastle", "NEW", "#c2c9cd"),
      t(58, "Aston Villa", "AVL", "#b8779d"),
    ],
  ];
  return teams.map(([league, home, away], i) => ({
    id: `demo-${i + 1}`,
    league,
    home,
    away,
    kickoff: new Date(now + (i < 6 ? 3 + i : 26 + i) * 3600000).toISOString(),
    status: "TIMED",
    score: { home: null, away: null },
    demo: true,
    matchday: 1,
  }));
}
