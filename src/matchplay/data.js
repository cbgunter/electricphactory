export const API = "https://iaatvn44bj.execute-api.us-east-1.amazonaws.com";

export const REGIONS = {
  SOUTH: {
    name: "South",
    players: [
      "Mike Revak", "Colm Parrish", "Craig Boge", "Evan Cannon",
      "Ben Chambers", "Alan Mitteer", "Athanasi Kourkoulis", "Patrick Finn",
      "Andy Flexon", "Bob Taylor", "Corey Gunter", "Will James",
    ],
  },
  NORTH: {
    name: "North",
    players: [
      "Adam Bucci", "Matt Tyblewski", "Riley Krupen", "Brendan Hoover",
      "Kiaran Leary", "Jeff Grace", "Shawn Garis", "Ajay Patel",
      "Zack Tlumak", "Adam Yoder", "Will Simons", "Jared Keating",
    ],
  },
};

export const ALL_PLAYERS = [...REGIONS.SOUTH.players, ...REGIONS.NORTH.players].sort();

export const MIN_MATCHES = 5;
export const MAX_MATCHES = 10;
export const BEST_OF = 5;

// Flip to true once group play is far enough along for the bracket to mean anything.
export const SHOW_BRACKET = false;

export const PLAYOFF_ROUNDS = {
  QUARTER: { label: "Quarterfinal", slots: 4 },
  SEMI: { label: "Semifinal", slots: 2 },
  FINAL: { label: "Final", slots: 1 },
};

// For each player, collect one result-row per match they played (from their perspective).
function playerResults(name, regionMatches) {
  const rows = [];
  regionMatches.forEach(m => {
    if (m.player1 === name) {
      rows.push({ opponent: m.player2, isTie: m.isTie, won: !m.isTie && m.winner === name, diff: m.isTie ? 0 : (m.winner === name ? m.differential : -m.differential) });
    } else if (m.player2 === name) {
      rows.push({ opponent: m.player1, isTie: m.isTie, won: !m.isTie && m.winner === name, diff: m.isTie ? 0 : (m.winner === name ? m.differential : -m.differential) });
    }
  });
  return rows.map(r => ({ ...r, points: r.won ? 3 : r.isTie ? 1 : 0 }));
}

export function calculateStandings(regionKey, players, matches) {
  const regionMatches = matches.filter(m => m.group === regionKey);

  const standings = players.map(name => {
    const results = playerResults(name, regionMatches);
    const totalPlayed = results.length;

    // Best 5 results (by points, then differential) count toward the standings.
    // Anything beyond that is "extra" — it doesn't change the record, but breaks ties.
    const counted = [...results].sort((a, b) => b.points - a.points || b.diff - a.diff).slice(0, BEST_OF);

    const won = counted.filter(r => r.won).length;
    const tied = counted.filter(r => r.isTie).length;
    const lost = counted.length - won - tied;
    const points = counted.reduce((s, r) => s + r.points, 0);
    const differential = counted.reduce((s, r) => s + r.diff, 0);

    return { name, played: counted.length, totalPlayed, won, tied, lost, points, differential };
  });

  standings.sort((a, b) => b.points - a.points || b.differential - a.differential || b.totalPlayed - a.totalPlayed);
  standings.forEach((s, i) => { s.rank = i + 1; });
  return standings;
}

export function calculateAllStandings(matches) {
  return Object.fromEntries(
    Object.entries(REGIONS).map(([key, g]) => [key, calculateStandings(key, g.players, matches)])
  );
}

// Top 4 from each region seed into an 8-player bracket. Seeds are crossed
// (N1/S4, S1/N4, N2/S3, S2/N3) so the two regions can't meet again until the final.
export function generateBracket(allStandings, matches) {
  const seed = (key, i) => allStandings[key]?.[i]?.name || "TBD";

  const byRound = round => matches.filter(m => m.group === round).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
  const quarterMatches = byRound("QUARTER");
  const semiMatches = byRound("SEMI");
  const finalMatches = byRound("FINAL");

  function resolveMatch(arr, idx, defaultP1, defaultP2) {
    const m = arr[idx];
    if (m) return { player1: m.player1, player2: m.player2, winner: m.winner === "TBD" ? null : m.winner, differential: m.differential, isTie: m.isTie, completed: !m.isTie && m.winner !== "TBD" };
    return { player1: defaultP1, player2: defaultP2, winner: null, differential: 0, isTie: false, completed: false };
  }

  const bracket = {
    quarters: [
      resolveMatch(quarterMatches, 0, seed("NORTH", 0), seed("SOUTH", 3)),
      resolveMatch(quarterMatches, 1, seed("SOUTH", 0), seed("NORTH", 3)),
      resolveMatch(quarterMatches, 2, seed("NORTH", 1), seed("SOUTH", 2)),
      resolveMatch(quarterMatches, 3, seed("SOUTH", 1), seed("NORTH", 2)),
    ],
    semis: [
      resolveMatch(semiMatches, 0, "TBD", "TBD"),
      resolveMatch(semiMatches, 1, "TBD", "TBD"),
    ],
    final: resolveMatch(finalMatches, 0, "TBD", "TBD"),
  };

  if (bracket.quarters[0].winner && bracket.quarters[1].winner) {
    bracket.semis[0].player1 = bracket.quarters[0].winner;
    bracket.semis[0].player2 = bracket.quarters[1].winner;
  }
  if (bracket.quarters[2].winner && bracket.quarters[3].winner) {
    bracket.semis[1].player1 = bracket.quarters[2].winner;
    bracket.semis[1].player2 = bracket.quarters[3].winner;
  }
  if (bracket.semis[0].winner && bracket.semis[1].winner) {
    bracket.final.player1 = bracket.semis[0].winner;
    bracket.final.player2 = bracket.semis[1].winner;
  }

  return bracket;
}

export function fmtDiff(d) { return d === 0 ? "0" : d > 0 ? `+${d}` : `${d}`; }

// Site convention: first name + last initial only.
export function displayName(name) {
  if (!name || name === "TBD") return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
